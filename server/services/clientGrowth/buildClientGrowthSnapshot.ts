/**
 * Maps Ascendra OS data (assessments, diagnosis, CRM, funnels) into ClientGrowthSnapshot.
 */
import { db } from "@server/db";
import { storage } from "@server/storage";
import { growthDiagnosisReports, growthFunnelLeads, type FunnelContent } from "@shared/schema";
import type {
  ClientGrowthSnapshot,
  BandSummary,
  GrowthLineItem,
  GrowthActivityItem,
  GrowthStepState,
} from "@shared/clientGrowthSnapshot";
import { loadAmieDigestForCrmContacts } from "@server/services/clientGrowth/loadAmieDigestForCrmContacts";
import { desc, sql } from "drizzle-orm";

function normEmail(e: string | null | undefined): string {
  return (e ?? "").trim().toLowerCase();
}

function scoreToBand(score: number | null | undefined, invert = false): BandSummary {
  if (score == null || !Number.isFinite(score)) {
    return {
      label: "Not measured yet",
      summary: "Run a diagnostic or finish your assessment so we can summarize this for you.",
    };
  }
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const effective = invert ? 100 - s : s;
  if (effective >= 72) {
    return { label: "Strong", summary: "You're in solid shape here compared to most local service businesses." };
  }
  if (effective >= 45) {
    return { label: "Mixed", summary: "There's room to tighten this up—small fixes often move the needle." };
  }
  return { label: "Needs attention", summary: "This area is likely costing you leads or trust. Prioritize clarity and proof." };
}

function bottleneckToIssue(bottleneck: string | null | undefined): string {
  const b = (bottleneck ?? "").toLowerCase();
  if (b === "brand") return "Your brand message may be unclear—customers aren't sure why to pick you.";
  if (b === "design") return "How you look online may be weakening trust before they ever call.";
  if (b === "system") return "Your website or booking path may be losing people before they convert.";
  return "We need a clearer picture of your funnel—starting with your site and offer.";
}

function extractAssessmentScore(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const candidates = ["overallScore", "overall", "score", "readinessScore", "totalScore"];
  for (const k of candidates) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      return v > 10 ? Math.min(100, Math.round(v)) : Math.min(100, Math.round(v * 100));
    }
  }
  return null;
}

/** Funnel JSON rows that power public Diagnose resources — summarized for Build, not copied verbatim. */
const CLIENT_GROWTH_FUNNEL_SLUGS = ["growth-kit", "website-score", "action-plan", "offer", "qualify-funnel"] as const;

const FUNNEL_SLUG_LABELS: Record<string, string> = {
  "growth-kit": "Growth kit",
  "website-score": "Website score",
  "action-plan": "Action plan",
  offer: "Offer funnel",
  "qualify-funnel": "Qualify funnel",
};

function topAttributionFromContacts(contacts: { utmSource?: string | null; source?: string | null }[]): string | null {
  const counts = new Map<string, number>();
  for (const c of contacts) {
    const raw = (c.utmSource?.trim() || c.source?.trim() || "").toLowerCase();
    if (!raw) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  let bestKey: string | null = null;
  let bestN = 0;
  for (const [k, v] of counts) {
    if (v > bestN) {
      bestN = v;
      bestKey = k;
    }
  }
  if (!bestKey) return null;
  return bestKey.length > 1 ? bestKey[0]!.toUpperCase() + bestKey.slice(1) : bestKey.toUpperCase();
}

export async function buildClientGrowthSnapshot(userId: number): Promise<ClientGrowthSnapshot> {
  const user = await storage.getUser(userId);
  const emailRaw = user?.email?.trim() ?? "";
  const emailNorm = normEmail(emailRaw);
  const businessLabel =
    (user && "full_name" in user && typeof (user as { full_name?: string }).full_name === "string"
      ? (user as { full_name: string }).full_name
      : null)?.trim() ||
    emailRaw ||
    "Your business";

  const [assessments, crmRows] = await Promise.all([
    storage.getClientProjects(userId),
    emailNorm ? storage.getCrmContactsByNormalizedEmails([emailRaw]) : Promise.resolve([]),
  ]);

  const primaryCrm = crmRows.sort((a, b) => {
    const score = (c: (typeof crmRows)[0]) => (c.type === "lead" ? 0 : 1);
    return score(a) - score(b);
  })[0];

  let diagnosis: typeof growthDiagnosisReports.$inferSelect | undefined;
  let funnelLead: typeof growthFunnelLeads.$inferSelect | undefined;

  if (emailNorm) {
    const [dRows, fRows] = await Promise.all([
      db
        .select()
        .from(growthDiagnosisReports)
        .where(sql`lower(trim(coalesce(${growthDiagnosisReports.email}, ''))) = ${emailNorm}`)
        .orderBy(desc(growthDiagnosisReports.createdAt))
        .limit(1),
      db
        .select()
        .from(growthFunnelLeads)
        .where(sql`lower(trim(coalesce(${growthFunnelLeads.email}, ''))) = ${emailNorm}`)
        .orderBy(desc(growthFunnelLeads.createdAt))
        .limit(1),
    ]);
    diagnosis = dRows[0];
    funnelLead = fRows[0];
  }

  const latestAssessment = assessments[0];
  const assessScore = latestAssessment ? extractAssessmentScore(latestAssessment.assessmentData) : null;
  const diagScore = diagnosis?.overallScore ?? null;
  const funnelScore = funnelLead?.totalScore != null ? Math.min(100, Math.max(0, funnelLead.totalScore)) : null;

  const healthCandidates = [assessScore, diagScore, funnelScore].filter((x): x is number => x != null && Number.isFinite(x));
  const healthScore0to100 =
    healthCandidates.length > 0 ?
      Math.round(healthCandidates.reduce((a, b) => a + b, 0) / healthCandidates.length)
    : null;

  const primaryIssue =
    funnelLead?.primaryBottleneck ?
      bottleneckToIssue(funnelLead.primaryBottleneck)
    : diagnosis?.primaryGoal ?
      `Growth is held back by: ${diagnosis.primaryGoal.slice(0, 120)}${diagnosis.primaryGoal.length > 120 ? "…" : ""}`
    : latestAssessment?.status === "pending" ?
      "We're still reviewing your project assessment—check back soon."
    : "Clarity between what you offer and how easy it is to book you online.";

  const missedOpportunityHint =
    healthScore0to100 != null && healthScore0to100 < 60 ?
      "Every week without a clear booking path, you're likely losing jobs to competitors who are easier to reach."
    : "Small improvements in your offer wording and call-to-action often unlock more booked jobs without more ad spend.";

  const diagnoseComplete =
    assessments.length > 0 || !!diagnosis || !!funnelLead || assessScore != null || diagScore != null;

  const hasReviewedAssessment = assessments.some((a) => a.status === "reviewed" || a.status === "contacted");

  const funnelRowPromises = CLIENT_GROWTH_FUNNEL_SLUGS.map((slug) =>
    storage.getFunnelContent(slug).catch((): undefined => undefined),
  );
  const [invoices, quotesByUser, quotesByEmail, announcements, ...funnelRowsAndAmie] = await Promise.all([
    storage.getClientInvoices(userId).catch(() => []),
    storage.getClientQuotes(userId).catch(() => []),
    emailRaw ? storage.getClientQuotesByEmail(emailRaw).catch(() => []) : Promise.resolve([]),
    storage.getClientAnnouncements(userId).catch(() => []),
    ...funnelRowPromises,
    loadAmieDigestForCrmContacts(crmRows.map((c) => c.id)),
  ]);
  const funnelContentRows = funnelRowsAndAmie.slice(0, funnelRowPromises.length) as (FunnelContent | undefined)[];
  const amieSlice = funnelRowsAndAmie[funnelRowPromises.length] as Awaited<
    ReturnType<typeof loadAmieDigestForCrmContacts>
  >;
  const quoteSeen = new Set<number>();
  const quotes = [...quotesByUser];
  for (const q of quotesByEmail) {
    if (!quoteSeen.has(q.id)) {
      quoteSeen.add(q.id);
      quotes.push(q);
    }
  }
  const hasCommercialFootprint = invoices.length > 0 || quotes.length > 0;

  const diagnoseState: GrowthStepState = diagnoseComplete ? "complete" : assessments.length > 0 || !!funnelLead ? "in_progress" : "not_started";

  let build: GrowthStepState;
  if (!diagnoseComplete) build = "locked";
  else if (hasCommercialFootprint || hasReviewedAssessment) build = "active";
  else if (assessments.length > 0) build = "in_progress";
  else build = "in_progress";

  let scaleState: GrowthStepState;
  if (build === "locked" || build === "in_progress") scaleState = "locked";
  else if (primaryCrm) scaleState = "active";
  else scaleState = "in_progress";

  const currentStep: 1 | 2 | 3 =
    diagnoseState !== "complete" ? 1 : build === "locked" ? 1 : scaleState === "locked" ? 2 : 3;

  const growthStatusLine =
    currentStep === 1 ? "Stage 1 — See what's holding back growth."
    : currentStep === 2 ? "Stage 2 — Your system is taking shape."
    : "Stage 3 — Double down on what's working.";

  const market: BandSummary = amieSlice.marketBand ?? scoreToBand(healthScore0to100);

  const website: BandSummary = scoreToBand(diagScore ?? funnelLead?.systemScore ?? assessScore);
  const offer: BandSummary = scoreToBand(funnelLead?.brandScore ?? assessScore ?? diagScore);

  const loadedFunnelSlugs = CLIENT_GROWTH_FUNNEL_SLUGS.filter((_, i) => funnelContentRows[i] != null);
  const funnelResourceHint =
    loadedFunnelSlugs.length > 0 ?
      `Live funnel content includes ${loadedFunnelSlugs.map((s) => FUNNEL_SLUG_LABELS[s] ?? s).join(", ")}.`
    : undefined;

  const funnelItems: GrowthLineItem[] = [
    {
      label: "Growth roadmap content",
      status: diagnoseComplete ? "active" : "pending",
      detail: [funnelResourceHint, "Guides and next steps aligned to your business."].filter(Boolean).join(" "),
    },
    {
      label: "Website & funnel health",
      status: diagScore != null || funnelLead != null ? "in_progress" : "pending",
      detail: "Based on your latest diagnostic inputs.",
    },
  ];

  const messagingItems: GrowthLineItem[] = [
    {
      label: "Offer & positioning clarity",
      status: funnelLead || latestAssessment ? "in_progress" : "pending",
      detail: funnelLead?.recommendation ? `Suggested path: ${funnelLead.recommendation.replace(/_/g, " ")}` : undefined,
    },
  ];

  const captureItems: GrowthLineItem[] = [
    {
      label: "Lead capture & CRM",
      status: primaryCrm ? "active" : diagnoseComplete ? "in_progress" : "pending",
      detail: primaryCrm ? "Your inquiries are on file with our team." : "We'll connect your leads as engagement ramps up.",
    },
    {
      label: "Booking & scheduling",
      status:
        crmRows.some((c) => c.bookedCallAt != null) ? "done"
        : primaryCrm ? "in_progress"
        : "pending",
      detail: undefined,
    },
  ];

  const followUpItems: GrowthLineItem[] = [
    {
      label: "Follow-up & updates",
      status: invoices.length + announcements.length > 0 ? "active" : "pending",
      detail: "Project updates appear in your client dashboard.",
    },
  ];

  /** scale numbers */
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let leadsThisWeekApprox = 0;
  if (primaryCrm?.createdAt && new Date(primaryCrm.createdAt).getTime() >= weekAgo) leadsThisWeekApprox = 1;

  const bookingsCount = primaryCrm?.bookedCallAt ? 1 : 0;
  const topChannelLabel = primaryCrm?.utmSource?.trim() || primaryCrm?.source?.trim() || null;

  const improvementBullets: string[] = [];
  if (healthScore0to100 != null && healthScore0to100 < 70) {
    improvementBullets.push("Tighten your main headline so a stranger knows what you do in one line.");
  }
  if (!primaryCrm?.bookedCallAt && diagnoseComplete) {
    improvementBullets.push("Add one obvious \"book now\" path on your site or Google Business Profile.");
  }
  if (improvementBullets.length === 0) {
    improvementBullets.push("Keep asking customers how they found you—we use that to optimize spend.");
  }

  const activity: GrowthActivityItem[] = [];
  if (primaryCrm?.id) {
    const logs = await storage.getCrmActivityLogByContactId(primaryCrm.id, 8);
    for (const log of logs) {
      const at =
        log.createdAt instanceof Date ?
          log.createdAt.toISOString()
        : typeof log.createdAt === "string" ?
          log.createdAt
        : new Date().toISOString();
      activity.push({
        title: log.title || log.type || "Update",
        at,
        kind: log.type || "activity",
      });
    }
  }
  if (latestAssessment) {
    activity.push({
      title: `Assessment ${latestAssessment.status === "pending" ? "received" : "updated"}`,
      at:
        latestAssessment.updatedAt?.toISOString?.() ??
        (typeof latestAssessment.updatedAt === "string" ? latestAssessment.updatedAt : new Date().toISOString()),
      kind: "assessment",
    });
  }
  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const diagnosePayload: ClientGrowthSnapshot["diagnose"] = {
    healthScore0to100,
    statusSummary:
      healthScore0to100 != null ?
        `Your business health score is ${healthScore0to100}/100—a simple blend of what we've measured so far.`
      : "We haven't scored your full picture yet. Start with a diagnostic or your project assessment.",
    primaryIssue,
    missedOpportunityHint,
    market,
    website,
    offer,
    nextCta:
      diagnoseComplete ?
        { label: "Continue to what's being built", href: "#build" }
      : { label: "Run the growth diagnosis", href: "/growth-diagnosis" },
  };
  if (amieSlice.digest) {
    diagnosePayload.amie = amieSlice.digest;
  }

  const snapshot: ClientGrowthSnapshot = {
    businessLabel,
    growthStatusLine,
    step: {
      diagnose: diagnoseState,
      build,
      scale: scaleState,
      current: currentStep,
    },
    diagnose: diagnosePayload,
    build: {
      activationSummary:
        build === "active" ?
          "Your growth system is active—we're capturing and organizing your pipeline alongside your projects."
        : "We're assembling the pieces: clearer messaging, dependable capture, and a path to book you.",
      funnel: funnelItems,
      messaging: messagingItems,
      capture: captureItems,
      followUp: followUpItems,
      nextCta:
        scaleState !== "locked" ?
          { label: "See results & scale", href: "#scale" }
        : { label: "Open your dashboard", href: "/dashboard" },
    },
    scale: {
      leadsThisWeekApprox,
      bookingsCount,
      topChannelLabel,
      trendHint:
        topChannelLabel ?
          `Recent activity suggests ${topChannelLabel} is part of how people find you—worthy of focus.`
        : "Once we track more leads, your top channel will show up here.",
      improvementBullets,
      nextCta: { label: "Book a strategy check-in", href: "/strategy-call" },
    },
    activity: activity.slice(0, 12),
  };

  return snapshot;
}
