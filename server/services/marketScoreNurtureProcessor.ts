/**
 * Sends delayed Market Score nurture emails (Brevo) — invoked from cron.
 */

import { asc, eq, and, lte } from "drizzle-orm";
import { db } from "@server/db";
import { marketScoreNurtureJobs } from "@shared/schema";
import { storage } from "@server/storage";
import { sendBrevoTransactional } from "@server/services/communications/brevoTransactional";
import { emailService } from "@server/services/emailService";
import {
  marketScoreEmail2Html,
  marketScoreEmail3Html,
} from "@server/services/marketScoreFunnelService";
import { getSiteOriginForMetadata } from "@/lib/siteUrl";

function strategyCallUrl(): string {
  const base = getSiteOriginForMetadata().replace(/\/$/, "");
  return `${base}/strategy-call`;
}

export async function processDueMarketScoreNurtureJobs(limit = 25): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const now = new Date();
  const rows = await db
    .select()
    .from(marketScoreNurtureJobs)
    .where(and(eq(marketScoreNurtureJobs.status, "pending"), lte(marketScoreNurtureJobs.runAt, now)))
    .orderBy(asc(marketScoreNurtureJobs.runAt))
    .limit(limit);

  let sent = 0;
  let failed = 0;

  for (const job of rows) {
    const contact = await storage.getCrmContactById(job.crmContactId);
    if (!contact?.email?.trim()) {
      await db
        .update(marketScoreNurtureJobs)
        .set({
          status: "failed",
          lastError: "contact_missing_or_no_email",
          attempts: job.attempts + 1,
        })
        .where(eq(marketScoreNurtureJobs.id, job.id));
      failed++;
      continue;
    }

    if (contact.doNotContact) {
      await db.update(marketScoreNurtureJobs).set({ status: "skipped" }).where(eq(marketScoreNurtureJobs.id, job.id));
      continue;
    }

    const strategyUrl = strategyCallUrl();
    const name = contact.name?.trim() || "there";
    const html =
      job.step === 2
        ? marketScoreEmail2Html({ name, strategyUrl })
        : marketScoreEmail3Html({ name, strategyUrl });
    const subject =
      job.step === 2
        ? "Your market snapshot — unlock the full picture"
        : "Strategy call — full Market Score report";

    const to = contact.email.trim();
    const brevoResult = await sendBrevoTransactional({
      to,
      subject,
      htmlContent: html,
    });
    const brevoError = brevoResult.ok ? null : brevoResult.error;
    let sentOk = brevoResult.ok;
    if (!sentOk && brevoError) {
      console.warn("[market-score nurture] Brevo REST failed:", brevoError);
      sentOk = await emailService.sendTransactionalHtmlEmail({ to, subject, htmlContent: html });
    }

    if (sentOk) {
      await db
        .update(marketScoreNurtureJobs)
        .set({ status: "sent", lastError: null })
        .where(eq(marketScoreNurtureJobs.id, job.id));
      sent++;
    } else {
      const attempts = job.attempts + 1;
      await db
        .update(marketScoreNurtureJobs)
        .set({
          status: attempts >= 4 ? "failed" : "pending",
          attempts,
          lastError: brevoError?.slice(0, 500) ?? "send_failed",
          ...(attempts < 4 ? { runAt: new Date(Date.now() + 15 * 60 * 1000) } : {}),
        })
        .where(eq(marketScoreNurtureJobs.id, job.id));
      failed++;
    }
  }

  return { processed: rows.length, sent, failed };
}
