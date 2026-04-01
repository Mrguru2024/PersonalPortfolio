import { db } from "@server/db";
import {
  growthAutomationRules,
  growthAutomationRuns,
  growthLeadSignals,
} from "@shared/schema";
import { and, count, eq, gte, isNull, lte } from "drizzle-orm";
import { sendBrevoTransactional } from "@server/services/communications/brevoTransactional";

const PRICING_HINTS = ["/pricing", "/price", "pricing"];
const BOOKING_HINTS = ["/book", "/schedule", "/strategy-call", "/call"];

function pathFrom(input: { url?: string; eventPaths: string[] }): string {
  for (const p of input.eventPaths) {
    if (p) return p;
  }
  if (input.url) {
    try {
      return new URL(input.url).pathname || input.url;
    } catch {
      return input.url;
    }
  }
  return "";
}

function matchesHint(pathLower: string, hints: string[]) {
  return hints.some((h) => pathLower.includes(h));
}

async function recentSignalCount(behaviorSessionId: number, signalType: string, since: Date) {
  const [row] = await db
    .select({ c: count() })
    .from(growthLeadSignals)
    .where(
      and(
        eq(growthLeadSignals.behaviorSessionId, behaviorSessionId),
        eq(growthLeadSignals.signalType, signalType),
        gte(growthLeadSignals.createdAt, since),
        isNull(growthLeadSignals.dismissedAt),
      ),
    );
  return Number(row?.c ?? 0);
}

async function insertSignal(input: {
  signalType: string;
  title: string;
  body?: string;
  severity: "low" | "medium" | "high";
  crmContactId?: number | null;
  behaviorSessionId: number;
  behaviorSessionKey: string;
  pagePath?: string;
  payloadJson?: Record<string, unknown>;
}) {
  await db.insert(growthLeadSignals).values({
    signalType: input.signalType,
    title: input.title,
    body: input.body ?? null,
    severity: input.severity,
    crmContactId: input.crmContactId ?? null,
    behaviorSessionId: input.behaviorSessionId,
    behaviorSessionKey: input.behaviorSessionKey,
    pagePath: input.pagePath?.slice(0, 2048) ?? null,
    payloadJson: input.payloadJson ?? {},
  });
}

export async function evaluateLeadSignalsAfterIngest(input: {
  behaviorSessionId: number;
  sessionKey: string;
  crmContactId?: number | null;
  url?: string;
  events: Array<{ eventType: string; eventData?: Record<string, unknown> }>;
}) {
  const debounceSince = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const eventPaths: string[] = [];
  let formStart = false;
  let formSubmit = false;
  let ctaClicks = 0;
  for (const e of input.events) {
    const t = e.eventType.toLowerCase();
    const page =
      typeof e.eventData?.page === "string" ? e.eventData.page
      : typeof e.eventData?.path === "string" ? e.eventData.path
      : "";
    if (page) eventPaths.push(page);
    if (t.includes("form") && t.includes("start")) formStart = true;
    if (t.includes("form") && (t.includes("submit") || t.includes("complete"))) formSubmit = true;
    if (t === "cta_click" || t.includes("cta")) ctaClicks += 1;
  }
  const path = pathFrom({ url: input.url, eventPaths });
  const pathLower = path.toLowerCase();

  const base = {
    behaviorSessionId: input.behaviorSessionId,
    behaviorSessionKey: input.sessionKey,
    crmContactId: input.crmContactId,
    pagePath: path || undefined,
  };

  if (matchesHint(pathLower, PRICING_HINTS)) {
    if ((await recentSignalCount(input.behaviorSessionId, "pricing_view", debounceSince)) < 1) {
      await insertSignal({
        ...base,
        signalType: "pricing_view",
        title: "Pricing page engagement",
        body: "Visitor activity includes a pricing-intent path — good moment for follow-up if they’re CRM-linked.",
        severity: "medium",
        payloadJson: { path },
      });
      await enqueueMatchingAutomations("pricing_view", base);
    }
  }

  if (matchesHint(pathLower, BOOKING_HINTS)) {
    if ((await recentSignalCount(input.behaviorSessionId, "booking_view", debounceSince)) < 1) {
      await insertSignal({
        ...base,
        signalType: "booking_view",
        title: "Booking / schedule interest",
        body: "Session touched a booking or strategy-call path.",
        severity: "high",
        payloadJson: { path },
      });
      await enqueueMatchingAutomations("booking_view", base);
    }
  }

  if (formStart && !formSubmit) {
    if ((await recentSignalCount(input.behaviorSessionId, "form_abandon", debounceSince)) < 1) {
      await insertSignal({
        ...base,
        signalType: "form_abandon",
        title: "Form started — no completion in this batch",
        body: "Capture follow-up if this visitor is known in CRM.",
        severity: "high",
        payloadJson: { path },
      });
      await enqueueMatchingAutomations("form_abandon", base);
    }
  }

  if (ctaClicks >= 3) {
    if ((await recentSignalCount(input.behaviorSessionId, "cta_spike", debounceSince)) < 1) {
      await insertSignal({
        ...base,
        signalType: "cta_spike",
        title: "Repeated CTA engagement",
        body: `${ctaClicks} CTA-related events in this ingest batch — high intent signal.`,
        severity: "medium",
        payloadJson: { ctaClicks, path },
      });
      await enqueueMatchingAutomations("cta_spike", base);
    }
  }
}

async function enqueueMatchingAutomations(triggerType: string, payload: Record<string, unknown>) {
  const rules = await db
    .select()
    .from(growthAutomationRules)
    .where(and(eq(growthAutomationRules.enabled, true), eq(growthAutomationRules.triggerType, triggerType)));
  const now = Date.now();
  for (const r of rules) {
    const delayMs = Math.max(0, (r.delayMinutes ?? 0) * 60 * 1000);
    const runAfter = new Date(now + delayMs);
    await db.insert(growthAutomationRuns).values({
      ruleId: r.id,
      status: "pending",
      runAfter,
      payloadJson: { ...payload, triggerType },
    });
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function processDueAutomationRuns(limit = 25) {
  const now = new Date();
  const rows = await db
    .select()
    .from(growthAutomationRuns)
    .where(and(eq(growthAutomationRuns.status, "pending"), lte(growthAutomationRuns.runAfter, now)))
    .limit(limit);
  for (const run of rows) {
    const [rule] = await db
      .select()
      .from(growthAutomationRules)
      .where(eq(growthAutomationRules.id, run.ruleId))
      .limit(1);
    if (!rule) {
      await db
        .update(growthAutomationRuns)
        .set({ status: "failed", resultJson: { error: "rule_missing" } })
        .where(eq(growthAutomationRuns.id, run.id));
      continue;
    }
    const actions = rule.actionsJson as Record<string, unknown>;
    const result: Record<string, unknown> = { ruleId: rule.id };
    try {
      if (typeof actions.emailTo === "string" && actions.emailTo.trim()) {
        const subj =
          typeof actions.emailSubject === "string" ? actions.emailSubject : `Automation: ${rule.name}`;
        const html =
          typeof actions.emailHtml === "string" ?
            actions.emailHtml
          : `<p>Rule <strong>${escapeHtml(rule.name)}</strong> fired.</p><pre>${escapeHtml(JSON.stringify(run.payloadJson, null, 2))}</pre>`;
        const send = await sendBrevoTransactional({ to: actions.emailTo.trim(), subject: subj, htmlContent: html });
        result.brevo = send.ok ? { ok: true, messageId: send.messageId } : { ok: false, error: send.error };
      } else {
        result.note = "No emailTo configured — run logged only.";
      }
      await db
        .update(growthAutomationRuns)
        .set({ status: "completed", resultJson: result })
        .where(eq(growthAutomationRuns.id, run.id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await db
        .update(growthAutomationRuns)
        .set({ status: "failed", resultJson: { ...result, error: msg } })
        .where(eq(growthAutomationRuns.id, run.id));
    }
  }
}
