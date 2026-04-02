/**
 * Public Market Score funnel: CRM + AMIE preview + Brevo nurture + queue for delayed sends.
 */

import { db } from "@server/db";
import { marketScoreNurtureJobs } from "@shared/schema";
import { storage } from "@server/storage";
import { ensureCrmLeadFromFormSubmission, type FormAttribution } from "@server/services/leadFromFormService";
import { aeeFieldsForFormAttribution } from "@/lib/aeeFormAttributionZod";
import { runAmieAnalysis, saveAmieAnalysis } from "@server/services/amie/amieAnalysisService";
import { addScoreFromEvent } from "@server/services/leadScoringService";
import { mergeSegmentTags } from "@server/services/leadSegmentationService";
import { sendBrevoTransactional } from "@server/services/communications/brevoTransactional";
import { emailService } from "@server/services/emailService";
import type { MarketScoreFunnelBody } from "@/lib/market-score/requestSchema";
import type { AmieMarketInput } from "@server/services/amie/types";

export type ScoreBandLabel = { label: string; score: number };

function bandDemand(score: number): ScoreBandLabel {
  if (score >= 70) return { label: "Strong demand", score };
  if (score >= 45) return { label: "Moderate demand", score };
  return { label: "Lower demand", score };
}

function bandCompetition(score: number): ScoreBandLabel {
  if (score >= 70) return { label: "High competition", score };
  if (score >= 45) return { label: "Moderate competition", score };
  return { label: "Lower competition", score };
}

function bandPurchasePower(score: number): ScoreBandLabel {
  if (score >= 70) return { label: "Strong purchase power", score };
  if (score >= 45) return { label: "Moderate purchase power", score };
  return { label: "Constrained purchase power", score };
}

function slugTag(prefix: string, raw: string, maxLen = 48): string {
  const s = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, maxLen);
  return s ? `${prefix}_${s}` : prefix;
}

function urgencyBucket(timeline: string | null | undefined): string {
  const t = (timeline ?? "").toLowerCase();
  if (/asap|urgent|now|this week|immediate|2\s*week|two week/i.test(t)) return "high";
  if (/month|quarter|90|60|45/i.test(t)) return "medium";
  if (t.trim().length > 0) return "standard";
  return "unknown";
}

function revenueBucket(monthlyRevenue: string | null | undefined): string {
  const r = (monthlyRevenue ?? "").toLowerCase();
  if (/250|300|500|million|1m|2m|\$[\d,]+k.*250/i.test(r)) return "high";
  if (/100|150|200|mid\s*six|100\s*k/i.test(r)) return "high_mid";
  if (/50|75|40|30|20|10\s*-\s*50|10-50/i.test(r)) return "mid";
  if (/10|under|less|\<|starting|early|pre-revenue|0\s*-\s*10/i.test(r)) return "early";
  if (r.trim().length > 0) return "unknown";
  return "unknown";
}

function strategyCallUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/strategy-call`;
}

export function buildMarketScorePreviewScores(marketData: {
  demandScore: number;
  competitionScore: number;
  purchasePowerScore: number;
}) {
  return {
    demand: bandDemand(marketData.demandScore),
    competition: bandCompetition(marketData.competitionScore),
    purchasePower: bandPurchasePower(marketData.purchasePowerScore),
  };
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function marketScoreEmail1Html(input: {
  name: string;
  preview: ReturnType<typeof buildMarketScorePreviewScores>;
  strategyUrl: string;
  industry: string;
  location: string;
}): string {
  const n = escapeHtml(input.name.split(/\s+/)[0] || "there");
  return `
<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px">
  <p>Hi ${n},</p>
  <p>Thanks for running the <strong>Market Score</strong> for <strong>${escapeHtml(input.industry)}</strong> in <strong>${escapeHtml(input.location)}</strong>.</p>
  <p>Here is your snapshot:</p>
  <ul>
    <li><strong>Demand:</strong> ${escapeHtml(input.preview.demand.label)} (${input.preview.demand.score}/100)</li>
    <li><strong>Competition:</strong> ${escapeHtml(input.preview.competition.label)} (${input.preview.competition.score}/100)</li>
    <li><strong>Purchase power:</strong> ${escapeHtml(input.preview.purchasePower.label)} (${input.preview.purchasePower.score}/100)</li>
  </ul>
  <p>The full strategic breakdown—including positioning, funnel, and channel notes—is reserved for a short strategy call so we can align it to your real constraints.</p>
  <p style="margin:28px 0"><a href="${escapeHtml(input.strategyUrl)}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Book a strategy call</a></p>
  <p style="font-size:13px;color:#666">— Ascendra Technologies</p>
</body></html>`;
}

export function marketScoreEmail2Html(input: { name: string; strategyUrl: string }): string {
  const n = escapeHtml(input.name.split(/\s+/)[0] || "there");
  return `
<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px">
  <p>Hi ${n},</p>
  <p>You now have a quick read on demand, competition, and purchase power in the market you scored. The next step is matching those signals to <strong>your offer, capacity, and timeline</strong>—that is what the full report covers.</p>
  <p>If you want the complete playbook we generate for clients (positioning, funnel, and ad hints), grab a short strategy call and we will walk through it together.</p>
  <p style="margin:28px 0"><a href="${escapeHtml(input.strategyUrl)}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Unlock the full report</a></p>
  <p style="font-size:13px;color:#666">— Ascendra Technologies</p>
</body></html>`;
}

export function marketScoreEmail3Html(input: { name: string; strategyUrl: string }): string {
  const n = escapeHtml(input.name.split(/\s+/)[0] || "there");
  return `
<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px">
  <p>Hi ${n},</p>
  <p>Last note on your Market Score: the snapshot you saw is intentionally short. Teams that move fastest pair it with a focused call—so the recommendations reflect your real numbers, not generic benchmarks.</p>
  <p>We keep a few slots each week for these strategy calls. If growth in this market is still on your roadmap, this is the easiest way to get the full report and next steps.</p>
  <p style="margin:28px 0"><a href="${escapeHtml(input.strategyUrl)}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Book your strategy call</a></p>
  <p style="font-size:13px;color:#666">— Ascendra Technologies</p>
</body></html>`;
}

export type MarketScoreSubmitResult =
  | {
      ok: true;
      preview: {
        demand: ScoreBandLabel;
        competition: ScoreBandLabel;
        purchasePower: ScoreBandLabel;
      };
      /** False when both Brevo REST and SDK sends failed (check server logs / BREVO_API_KEY, FROM_EMAIL). */
      emailSent: boolean;
      emailError?: string;
    }
  | { ok: false; error: string; code?: string };

async function deliverMarketScoreSnapshotEmail(input: {
  to: string;
  subject: string;
  htmlContent: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const rest = await sendBrevoTransactional(input);
  if (rest.ok) return { ok: true };
  console.warn("[market-score] Brevo REST failed:", rest.error);
  const sdkOk = await emailService.sendTransactionalHtmlEmail(input);
  if (sdkOk) return { ok: true };
  return { ok: false, error: rest.error };
}

export async function processMarketScoreSubmission(
  body: MarketScoreFunnelBody,
  opts: { siteOrigin: string; clientIp?: string | null },
): Promise<MarketScoreSubmitResult> {
  if (body.websiteUrl?.trim()) {
    return { ok: false, error: "Unable to submit.", code: "spam" };
  }

  const attribution: FormAttribution = {
    utm_source: body.attribution?.utm_source ?? undefined,
    utm_medium: body.attribution?.utm_medium ?? undefined,
    utm_campaign: body.attribution?.utm_campaign ?? undefined,
    referrer: body.attribution?.referrer ?? undefined,
    landing_page: body.attribution?.landing_page ?? "/market-score",
    visitorId: body.visitorId ?? undefined,
    ...aeeFieldsForFormAttribution(body.attribution ?? undefined),
  };

  const utmExtra: Record<string, string> = {};
  if (body.attribution?.utm_term?.trim()) utmExtra.utm_term = body.attribution.utm_term.trim();
  if (body.attribution?.utm_content?.trim()) utmExtra.utm_content = body.attribution.utm_content.trim();
  if (body.attribution?.gclid?.trim()) utmExtra.gclid = body.attribution.gclid.trim();

  const customBeforeRun: Record<string, unknown> = {
    funnel: "market_score",
    marketScoreGoal: body.goal?.trim() || undefined,
    marketScoreTimeline: body.timeline?.trim() || undefined,
    marketScoreMonthlyRevenue: body.monthlyRevenue?.trim() || undefined,
    ...utmExtra,
  };

  const lead = await ensureCrmLeadFromFormSubmission({
    email: body.email.trim(),
    name: body.name.trim(),
    phone: body.phone?.trim() || null,
    company: body.company?.trim() || null,
    attribution,
    demographics: {
      industry: body.industry.trim(),
      companySize: null,
    },
    customFields: customBeforeRun,
  });

  if (!lead?.id) {
    return { ok: false, error: "Could not save your information. Please try again." };
  }

  const amieInput: AmieMarketInput = {
    projectKey: "ascendra_main",
    industry: body.industry.trim(),
    serviceType: body.serviceType.trim(),
    location: body.location.trim(),
    persona: body.persona.trim(),
  };

  const analysis = await runAmieAnalysis(amieInput, { skipCache: false });
  const md = analysis.marketData;
  const preview = buildMarketScorePreviewScores({
    demandScore: md.demandScore,
    competitionScore: md.competitionScore,
    purchasePowerScore: md.purchasePowerScore,
  });

  const researchId = await saveAmieAnalysis({
    createdByUserId: null,
    input: amieInput,
    analysis,
    crmContactId: lead.id,
    funnelSource: "market_score",
  });

  const urgency = urgencyBucket(body.timeline);
  const revenue = revenueBucket(body.monthlyRevenue);
  const personaTag = slugTag("msc_persona", body.persona.trim(), 40);
  const extraTags = [
    "tool_market_score",
    "funnel_market_score",
    personaTag,
    `msc_urgency_${urgency}`,
    `msc_revenue_${revenue}`,
  ];

  const prevCustom = (lead.customFields as Record<string, unknown> | null) ?? {};
  const mergedCustom: Record<string, unknown> = {
    ...prevCustom,
    ...customBeforeRun,
    amieResearchId: researchId,
    marketScorePreview: {
      demandScore: md.demandScore,
      competitionScore: md.competitionScore,
      purchasePowerScore: md.purchasePowerScore,
      demandLabel: preview.demand.label,
      competitionLabel: preview.competition.label,
      purchasePowerLabel: preview.purchasePower.label,
      generatedAt: new Date().toISOString(),
    },
    marketScoreInsightsLocked: true,
    marketScoreSubmitIp: opts.clientIp?.slice(0, 64) ?? undefined,
  };

  const mergedTags = mergeSegmentTags(lead.tags ?? undefined, extraTags);

  const sourcePatch =
    body.attribution?.utm_source?.trim() ||
    (!lead.source || lead.source === "website" ? "market_score" : lead.source);

  await storage.updateCrmContact(lead.id, {
    source: sourcePatch,
    customFields: mergedCustom,
    tags: mergedTags,
    industry: body.industry.trim() || lead.industry,
    notesSummary:
      `Market Score (${researchId}): ${preview.demand.label}; ${preview.competition.label}; ${preview.purchasePower.label}.`.slice(0, 500),
    lastActivityAt: new Date(),
  });

  await addScoreFromEvent(storage, lead.id, "market_score_complete", {
    page: "/market-score",
    component: "market_score_funnel",
  }).catch(() => {});

  const strategyUrl = strategyCallUrl(opts.siteOrigin);
  const displayName = body.name.trim();

  const emailPayload = {
    to: body.email.trim(),
    subject: "Your Market Score snapshot — Ascendra",
    htmlContent: marketScoreEmail1Html({
      name: displayName,
      preview,
      strategyUrl,
      industry: body.industry.trim(),
      location: body.location.trim(),
    }),
  };
  const emailResult = await deliverMarketScoreSnapshotEmail(emailPayload);
  if (!emailResult.ok) {
    console.error("[market-score] Snapshot email not delivered:", emailResult.error);
  }

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  await db.insert(marketScoreNurtureJobs).values([
    {
      crmContactId: lead.id,
      researchId,
      step: 2,
      runAt: new Date(now + day),
      status: "pending",
    },
    {
      crmContactId: lead.id,
      researchId,
      step: 3,
      runAt: new Date(now + 3 * day),
      status: "pending",
    },
  ]);

  const { queueAdminInboundNotification } = await import("./adminInboxService");
  queueAdminInboundNotification({
    kind: "market_score",
    title: `Market Score lead: ${body.name.trim()}`,
    body: `${body.email.trim()}\n${body.industry} · ${body.location}\nAMIE #${researchId}`,
    relatedType: "crm_contact",
    relatedId: lead.id,
    metadata: { researchId, funnel: "market_score" },
  });

  return {
    ok: true,
    preview,
    emailSent: emailResult.ok,
    ...(emailResult.ok ? {} : { emailError: emailResult.error }),
  };
}
