/**
 * Ascendra Growth System — unified offer stack (DFY / DWY / DIY).
 * Single source for tier metadata, pricing bands, and value framing helpers.
 * Adjust display copy in UI; keep ranges aligned with commercial policy here.
 */

import { z } from "zod";
import {
  MARKETING_CTA_APPLY_GUIDED_PROGRAM,
  MARKETING_CTA_BOOK_STRATEGY_CALL,
  MARKETING_CTA_CONTACT_GET_STARTED,
  MARKETING_CTA_EMAIL_US,
  MARKETING_CTA_OPEN_FREE_TOOLS,
  MARKETING_CTA_RUN_MARKET_SCORE,
} from "@shared/marketingCtaCopy";

export const ASCENDRA_OFFER_TIERS = ["DFY", "DWY", "DIY"] as const;
export type AscendraOfferTier = (typeof ASCENDRA_OFFER_TIERS)[number];

export const ascendraOfferTierSchema = z.enum(ASCENDRA_OFFER_TIERS);

/** USD cents for precise Stripe-style math in admin; public UI shows dollars. */
export type MoneyCentsRange = { minCents: number; maxCents: number };

export type AscendraOfferTierDefinition = {
  tier: AscendraOfferTier;
  title: string;
  headlineOutcome: string;
  timelineSummary: string;
  deliverablesSummary: string;
  pricing: {
    setup?: MoneyCentsRange;
    monthly?: MoneyCentsRange;
    program?: MoneyCentsRange;
    note: string;
  };
  riskReversalSummary: string;
  ctas: { label: string; href: string; variant: "primary" | "secondary" }[];
  /** Example jobs/month range for ROI copy — illustrative, not a guarantee. */
  illustrativeJobsPerMonthRange: [number, number];
  roiFramingExample: string;
};

/** Base catalog (persona overrides applied in `applyPersonaPricingFactor`). */
export const ASCENDRA_OFFER_STACK: Record<AscendraOfferTier, AscendraOfferTierDefinition> = {
  DFY: {
    tier: "DFY",
    title: "Done for you",
    headlineOutcome: "We install and run the growth system while you run the business.",
    timelineSummary: "Typical install: roughly 7–14 days for core funnel + tracking handoff; timelines vary by scope.",
    deliverablesSummary:
      "Funnel alignment, creative direction, campaign structure, tracking checklist, and ongoing optimization cadence.",
    pricing: {
      setup: { minCents: 350_000, maxCents: 1_200_000 },
      monthly: { minCents: 85_000, maxCents: 240_000 },
      note: "Setup plus monthly optimization. Ad spend is billed directly by platforms unless a separate media agreement says otherwise.",
    },
    riskReversalSummary:
      "Scope, milestones, and revision limits are defined in writing before kickoff. We do not promise specific lead counts or revenue outcomes—results depend on your market, offer, budget, and follow-up.",
    ctas: [
      { label: MARKETING_CTA_BOOK_STRATEGY_CALL, href: "/strategy-call", variant: "primary" },
      { label: MARKETING_CTA_CONTACT_GET_STARTED, href: "/contact", variant: "secondary" },
    ],
    illustrativeJobsPerMonthRange: [5, 15],
    roiFramingExample:
      "Many service businesses aim for roughly 5–15 booked jobs per month once funnel + ads + follow-up work together—that is an example target band, not a commitment.",
  },
  DWY: {
    tier: "DWY",
    title: "Done with you",
    headlineOutcome: "You execute with a clear plan—we coach, review, and keep you out of common missteps.",
    timelineSummary: "Program windows are scoped per engagement (often 4–12 weeks).",
    deliverablesSummary: "Offer positioning, funnel map, creative briefs, campaign structure templates, and weekly working sessions.",
    pricing: {
      program: { minCents: 250_000, maxCents: 850_000 },
      note: "Single-program investment range. Add-ons billed separately when scoped.",
    },
    riskReversalSummary:
      "Deliverables and call cadence are fixed in your statement of work. No guaranteed performance; your speed of implementation affects outcomes.",
    ctas: [
      { label: "Apply for DWY", href: "/strategy-call", variant: "primary" },
      { label: "Email questions", href: "/contact", variant: "secondary" },
    ],
    illustrativeJobsPerMonthRange: [3, 10],
    roiFramingExample:
      "DWY is built for owners who can invest time each week—example band 3–10 incremental wins per month when execution stays consistent.",
  },
  DIY: {
    tier: "DIY",
    title: "Done by you",
    headlineOutcome: "Start with free tools and lead magnets—upgrade when you want hands-on help.",
    timelineSummary: "Start immediately with guides and calculators; deeper builds optional.",
    deliverablesSummary: "Growth diagnostic flows, revenue tools, funnel entry points, and email follow-up where configured.",
    pricing: {
      note: "Core lead magnets are free; paid offers are optional and scoped separately.",
    },
    riskReversalSummary:
      "Free tools are educational only—you remain responsible for implementation, compliance, and business decisions.",
    ctas: [
      { label: MARKETING_CTA_OPEN_FREE_TOOLS, href: "/free-growth-tools", variant: "primary" },
      { label: MARKETING_CTA_RUN_MARKET_SCORE, href: "/market-score", variant: "secondary" },
    ],
    illustrativeJobsPerMonthRange: [1, 5],
    roiFramingExample:
      "DIY paths are for testing demand—expect wide variance until a real funnel + follow-up system is in place.",
  },
};

export function formatUsdRange(range: MoneyCentsRange | undefined): string {
  if (!range) return "—";
  const a = range.minCents / 100;
  const b = range.maxCents / 100;
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n).toLocaleString("en-US")}` : `$${Math.round(n)}`;
  return a === b ? fmt(a) : `${fmt(a)} – ${fmt(b)}`;
}

export function midSetupFeeCentsDfy(): number {
  const s = ASCENDRA_OFFER_STACK.DFY.pricing.setup!;
  return Math.round((s.minCents + s.maxCents) / 2);
}

/** Persona tuning: multiply program/setup list prices for display only (admin can persist factors later). */
export function applyPersonaPricingFactor(cents: number, factor: number): number {
  if (!Number.isFinite(factor) || factor <= 0) return cents;
  return Math.round(cents * factor);
}

export type JobRevenueImpactInputs = {
  averageJobValue: number;
  jobsPerMonthGoal: number;
  qualifiedLeadsPerMonth: number;
  /** 0–1; if omitted, a conservative default is used. */
  leadToJobCloseRate?: number;
};

export type JobRevenueImpactResult = {
  potentialMonthlyRevenue: number;
  estimatedCurrentMonthlyRevenue: number;
  estimatedMonthlyGap: number;
  impliedJobsFromLeads: number;
  breakEvenMonthsOnSetupMid: number | null;
  disclaimer: string;
};

const DEFAULT_CLOSE_RATE = 0.25;

/**
 * Illustrative math only — not financial or legal advice. Uses DFY setup midpoint as optional break-even hint.
 */
export function computeJobRevenueImpact(inputs: JobRevenueImpactInputs): JobRevenueImpactResult {
  const job = Math.max(0, inputs.averageJobValue);
  const goal = Math.max(0, inputs.jobsPerMonthGoal);
  const leads = Math.max(0, inputs.qualifiedLeadsPerMonth);
  const rate = inputs.leadToJobCloseRate ?? DEFAULT_CLOSE_RATE;
  const close = Math.max(0, Math.min(1, rate));

  const potentialMonthlyRevenue = goal * job;
  const impliedJobsFromLeads = leads * close;
  const estimatedCurrentMonthlyRevenue = impliedJobsFromLeads * job;
  const estimatedMonthlyGap = Math.max(0, potentialMonthlyRevenue - estimatedCurrentMonthlyRevenue);
  const setupMid = midSetupFeeCentsDfy() / 100;
  const breakEvenMonthsOnSetupMid =
    estimatedMonthlyGap > 0 ? Math.ceil(setupMid / estimatedMonthlyGap) : null;

  return {
    potentialMonthlyRevenue,
    estimatedCurrentMonthlyRevenue,
    estimatedMonthlyGap,
    impliedJobsFromLeads,
    breakEvenMonthsOnSetupMid,
    disclaimer:
      "Illustrative only. Close rates vary by industry and sales process. Ad spend, seasonality, and operations are not modeled here.",
  };
}

/**
 * Simple routing: if they already have strong lead flow vs goal, steer DIY/DWY; else DFY if goal is aggressive.
 */
export function recommendOfferTier(inputs: JobRevenueImpactInputs): AscendraOfferTier {
  const { impliedJobsFromLeads } = computeJobRevenueImpact(inputs);
  const goal = Math.max(0, inputs.jobsPerMonthGoal);
  if (goal <= 0) return "DIY";
  const ratio = goal > 0 ? impliedJobsFromLeads / goal : 0;
  if (ratio >= 0.85) return "DWY";
  if (goal >= 8 && ratio < 0.5) return "DFY";
  if (ratio < 0.35) return "DFY";
  return "DWY";
}
