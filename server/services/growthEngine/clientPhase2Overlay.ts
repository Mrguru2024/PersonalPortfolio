/**
 * Client-facing Phase 2 overlay: revenue attribution summary, scores, heuristics.
 * No admin-only knowledge or competitor raw data.
 */
import { db } from "@server/db";
import { growthCampaignCosts, growthRevenueEvents } from "@shared/schema";
import type { ClientPhase2Overlay } from "@shared/growthPhase2Types";
import { and, gte, inArray, lte, sql } from "drizzle-orm";

function fmtUsd(cents: number) {
  const n = cents / 100;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export async function buildClientPhase2Overlay(input: {
  contactIds: number[];
  since: Date;
  periodDays: number;
  sessions: number;
  convertedSessions: number;
  pageViewsApprox: number;
  highFrictionPages: number;
  topSourceLabel?: string;
}): Promise<ClientPhase2Overlay | undefined> {
  const { contactIds, since, periodDays, sessions, convertedSessions, pageViewsApprox, highFrictionPages, topSourceLabel } =
    input;

  let revenueCents = 0;
  if (contactIds.length > 0) {
    const [row] = await db
      .select({
        s: sql<number>`coalesce(sum(${growthRevenueEvents.amountCents}), 0)`.mapWith(Number),
      })
      .from(growthRevenueEvents)
      .where(
        and(gte(growthRevenueEvents.recordedAt, since), inArray(growthRevenueEvents.crmContactId, contactIds)),
      );
    revenueCents = row?.s ?? 0;
  }

  const until = new Date();
  const [costRow] = await db
    .select({
      s: sql<number>`coalesce(sum(${growthCampaignCosts.amountCents}), 0)`.mapWith(Number),
    })
    .from(growthCampaignCosts)
    .where(
      and(lte(growthCampaignCosts.periodStart, until), gte(growthCampaignCosts.periodEnd, since)),
    );
  const costCents = costRow?.s ?? 0;

  const convRate = sessions > 0 ? convertedSessions / sessions : 0;
  const conversionHealth = Math.max(
    0,
    Math.min(100, Math.round(convRate * 180) - Math.min(25, highFrictionPages * 4) + (sessions >= 5 ? 10 : 0)),
  );
  const trafficQuality = Math.max(
    0,
    Math.min(100, 55 + (topSourceLabel && topSourceLabel !== "Direct / other" ? 20 : 0) + Math.min(15, sessions)),
  );
  const funnelEfficiency = Math.max(
    0,
    Math.min(100, pageViewsApprox > 0 && sessions > 0 ? Math.round((convertedSessions / sessions) * 70) + 15 : 40),
  );

  const hints: string[] = [];
  if (convRate < 0.08 && sessions >= 8) {
    hints.push("Conversion rate is modest versus typical B2B service sites — tightening the booking path often lifts outcomes without more ad spend.");
  }
  if (highFrictionPages > 0) {
    hints.push("Friction flags are active — pairing clarity on mobile with your primary CTA is usually the fastest win.");
  }
  if (hints.length === 0) {
    hints.push("Scores refresh as more linked sessions and revenue events accrue — your Ascendra team can deepen attribution in Growth Engine.");
  }

  const predictiveNudges: string[] = [];
  if (sessions >= 6 && convertedSessions === 0) {
    predictiveNudges.push("Trend risk: healthy traffic with few recorded conversions — validate form and booking tags are firing.");
  }
  if (pageViewsApprox > 50 && convRate < 0.05) {
    predictiveNudges.push("Engagement is ahead of outcomes — consider a focused test on offer clarity above the fold.");
  }
  if (predictiveNudges.length === 0) {
    predictiveNudges.push("No urgent predictive warnings in this window — keep monitoring week-over-week.");
  }

  const benchmarkSnapshot =
    convRate >= 0.12 ?
      "Relative to typical Ascendra-tracked service funnels, your conversion signal is in a healthy band for this sample size."
    : convRate >= 0.05 ?
      "Within a common range for consultative offers — small UX lifts often move this band."
    : "Below typical mid-funnel benchmarks — prioritize one hero offer and a single primary CTA path while data collects.";

  const roiNet = revenueCents - costCents;
  const roiHint =
    costCents > 0 ?
      roiNet >= 0 ?
        `Rough margin this window (attributed revenue minus logged spend): about ${fmtUsd(roiNet)} — refine costs in Growth Engine for precision.`
      : `Spend is ahead of attributed revenue in this window by about ${fmtUsd(Math.abs(roiNet))} — confirm all Stripe deals are attributed.`
    : revenueCents > 0 ?
      "Add campaign costs in Growth Engine to unlock a simple ROI readout for clients."
    : undefined;

  return {
    revenueSummary: {
      totalAttributedDisplay:
        contactIds.length < 1 ? "—"
        : revenueCents > 0 ? fmtUsd(revenueCents)
        : "$0",
      periodNote:
        contactIds.length < 1 ?
          "Revenue attribution appears after your CRM profile links to closed deals or manual entries."
        : `Last ${periodDays} days · CRM-linked revenue events only.`,
      stripeLinkedNote:
        revenueCents > 0 ? "Includes Stripe-tagged or manual entries matched to your contacts." : undefined,
    },
    growthScores: {
      conversionHealth,
      trafficQuality,
      funnelEfficiency,
      hints,
    },
    predictiveNudges,
    benchmarkSnapshot,
    roiHint,
    personaInsight:
      "Persona-specific rollups (trades, beauty, SaaS, consultant) activate when Ascendra tags sessions or offers — ask your strategist to enable persona scoping.",
    offerInsight:
      "Offer-level performance compares lead magnets, audits, and high-ticket paths once CTAs use stable `data-ascendra-cta` keys and revenue is attributed.",
  };
}
