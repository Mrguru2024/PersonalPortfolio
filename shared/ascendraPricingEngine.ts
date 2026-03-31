/**
 * Ascendra Pricing & Offer System — deterministic pricing bands and value math (shared: server + admin UI).
 * No fabricated revenue: uses admin-entered job value × volume only.
 */
import type { OfferEngineOfferTemplateRow } from "./offerEngineSchema";
import {
  defaultAscendraPricingPackage,
  type AscendraPricingPackage,
  type AscendraPricingComputed,
  type TrivialLevel,
  type SystemComponentKey,
  type SupportComponentKey,
  SYSTEM_COMPONENT_KEYS,
  SUPPORT_COMPONENT_KEYS,
} from "./ascendraPricingPackageTypes";

const DFY_SETUP = { min: 2000, max: 7500 } as const;
const DFY_MONTHLY = { min: 300, max: 1000 } as const;
const DWY = { min: 500, max: 2000 } as const;
const DIY = { min: 0, max: 99 } as const;

const LEVEL_N: Record<TrivialLevel, number> = { low: 0.33, medium: 0.66, high: 1 };

function levelOrMid(x: TrivialLevel | null | undefined): number {
  if (!x) return 0.5;
  return LEVEL_N[x];
}

const SYSTEM_SETUP_BUMP: Record<SystemComponentKey, number> = {
  funnel_builder: 120,
  offer_creation: 90,
  lead_capture: 100,
  crm_setup: 140,
  booking_system: 80,
  ads_setup: 160,
  tracking_analytics: 110,
  optimization_engine: 130,
};

const SYSTEM_MONTHLY_BUMP: Record<SystemComponentKey, number> = {
  funnel_builder: 25,
  offer_creation: 15,
  lead_capture: 20,
  crm_setup: 30,
  booking_system: 15,
  ads_setup: 40,
  tracking_analytics: 25,
  optimization_engine: 35,
};

const SUPPORT_SETUP_BUMP: Record<SupportComponentKey, number> = {
  strategy_calls: 200,
  training: 120,
  documentation: 60,
  ongoing_optimization: 250,
};

const SUPPORT_MONTHLY_BUMP: Record<SupportComponentKey, number> = {
  strategy_calls: 40,
  training: 25,
  documentation: 10,
  ongoing_optimization: 80,
};

export const DEFAULT_MARKET_DISCLAIMER =
  "Results are not guaranteed and depend on market conditions, execution, and client participation. Past performance does not guarantee future outcomes.";

export const DEFAULT_PAYMENT_TERMS =
  "Setup fees are non-refundable once work begins. Monthly or recurring fees are billed in advance for each billing period.";

export const DEFAULT_NOT_INCLUDED = [
  "Ad spend paid directly to platforms",
  "Scope changes beyond the agreed deliverables",
  "Unlimited revision rounds beyond what is listed as included",
  "Third-party subscriptions unless explicitly included",
];

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function blendDfySetup(i: AscendraPricingPackage["inputs"]): [number, number] {
  const w =
    (levelOrMid(i.dfyComplexity as TrivialLevel) +
      levelOrMid(i.dfyTimeRequired as TrivialLevel) +
      levelOrMid(i.dfyRevenuePotential as TrivialLevel)) /
    3;
  const span = DFY_SETUP.max - DFY_SETUP.min;
  const center = DFY_SETUP.min + w * span;
  const width = span * 0.22;
  return [Math.round(center - width), Math.round(center + width)];
}

function blendDfyMonthly(i: AscendraPricingPackage["inputs"]): [number, number] {
  const w =
    (levelOrMid(i.dfyComplexity as TrivialLevel) +
      levelOrMid(i.dfyTimeRequired as TrivialLevel) +
      levelOrMid(i.dfyRevenuePotential as TrivialLevel)) /
    3;
  const span = DFY_MONTHLY.max - DFY_MONTHLY.min;
  const center = DFY_MONTHLY.min + w * span;
  const width = span * 0.2;
  return [Math.round(center - width), Math.round(center + width)];
}

function blendDwy(i: AscendraPricingPackage["inputs"]): [number, number] {
  const w =
    (levelOrMid(i.dwyGuidanceLevel as TrivialLevel) +
      levelOrMid(i.dwyDuration as TrivialLevel) +
      levelOrMid(i.dwyOutcomeClarity as TrivialLevel)) /
    3;
  const span = DWY.max - DWY.min;
  const center = DWY.min + w * span;
  const width = span * 0.2;
  return [Math.round(center - width), Math.round(center + width)];
}

function componentBumps(i: AscendraPricingPackage["inputs"]): { setup: number; monthly: number } {
  const sys = new Set(i.systemComponents ?? []);
  const sup = new Set(i.supportComponents ?? []);
  let setup = 0;
  let monthly = 0;
  for (const k of SYSTEM_COMPONENT_KEYS) {
    if (sys.has(k)) {
      setup += SYSTEM_SETUP_BUMP[k];
      monthly += SYSTEM_MONTHLY_BUMP[k];
    }
  }
  for (const k of SUPPORT_COMPONENT_KEYS) {
    if (sup.has(k)) {
      setup += SUPPORT_SETUP_BUMP[k];
      monthly += SUPPORT_MONTHLY_BUMP[k];
    }
  }
  return { setup, monthly };
}

function applyBumpsToRange(range: [number, number], bump: number, hardMax: number): [number, number] {
  return [
    clamp(Math.round(range[0] + bump * 0.6), DFY_SETUP.min, hardMax),
    clamp(Math.round(range[1] + bump), DFY_SETUP.min, hardMax),
  ];
}

export function computeRevenueProjection(
  avgJobValue: number | null | undefined,
  jobsPerMonth: number | null | undefined,
): { monthly: number; annual: number } {
  const a = avgJobValue ?? 0;
  const j = jobsPerMonth ?? 0;
  const monthly = Math.round(a * j);
  const annual = monthly * 12;
  return { monthly, annual };
}

export function buildAutoPositioningStatement(
  problem: string | null | undefined,
  system: string | null | undefined,
  outcome: string | null | undefined,
  row?: Pick<OfferEngineOfferTemplateRow, "coreProblem" | "primaryPromise" | "desiredOutcome">,
): string {
  const p = (problem ?? row?.coreProblem ?? "").trim();
  const s =
    (system ?? "").trim() ||
    "We install a growth system—capture, follow-up, booking, and measurement—so marketing stops living in guesswork.";
  const o = (outcome ?? row?.desiredOutcome ?? row?.primaryPromise ?? "").trim();
  const parts: string[] = [];
  if (p) parts.push(`Problem: ${p}`);
  parts.push(`System: ${s}`);
  if (o) parts.push(`Outcome: ${o}`);
  return parts.join(" ");
}

export function buildOutcomeSnippet(
  row: Pick<OfferEngineOfferTemplateRow, "primaryPromise" | "desiredOutcome">,
): string {
  const t = (row.primaryPromise ?? row.desiredOutcome ?? "").trim();
  if (t) return t.slice(0, 280);
  return "Consistent lead flow and booked conversations anchored to measurable pipeline—not random tactics.";
}

export function refreshPricingPackageComputed(
  row: OfferEngineOfferTemplateRow,
  pkg: AscendraPricingPackage,
): AscendraPricingPackage;
export function refreshPricingPackageComputed(
  row: OfferEngineOfferTemplateRow,
  pkg: AscendraPricingPackage | null | undefined,
): AscendraPricingPackage | null;
export function refreshPricingPackageComputed(
  row: OfferEngineOfferTemplateRow,
  pkg: AscendraPricingPackage | null | undefined,
): AscendraPricingPackage | null {
  if (!pkg) return null;
  const inputs = { ...defaultAscendraPricingPackage().inputs, ...pkg.inputs };
  const tier = pkg.tierFocus ?? "DFY";

  const bumps = componentBumps(inputs);
  let setupRange = blendDfySetup(inputs);
  let monthlyRange = blendDfyMonthly(inputs);
  setupRange = applyBumpsToRange(setupRange, bumps.setup, 25_000);
  monthlyRange = [
    clamp(monthlyRange[0] + Math.round(bumps.monthly * 0.7), DFY_MONTHLY.min, 5000),
    clamp(monthlyRange[1] + bumps.monthly, DFY_MONTHLY.min, 8000),
  ];

  const dwyRange = blendDwy(inputs);
  const diyHigh =
    inputs.diyIsFree ? 0 : clamp(inputs.diyLowTicketCents != null ? inputs.diyLowTicketCents / 100 : DIY.max, DIY.min, DIY.max);
  const diyRange: [number, number] = inputs.diyIsFree ? [0, 0] : [DIY.min, diyHigh];

  const { monthly: projectedMonthlyRevenue, annual: projectedAnnualRevenue } = computeRevenueProjection(
    inputs.avgJobValue,
    inputs.targetJobsPerMonth,
  );

  const midSetup = (setupRange[0] + setupRange[1]) / 2;
  const midMonthly = (monthlyRange[0] + monthlyRange[1]) / 2;
  const midDwy = (dwyRange[0] + dwyRange[1]) / 2;

  const suggestedSetup =
    inputs.setupPriceOverride != null ? inputs.setupPriceOverride : Math.round(midSetup + bumps.setup * 0.5);
  const suggestedMonthly =
    inputs.monthlyPriceOverride != null ? inputs.monthlyPriceOverride : Math.round(midMonthly + bumps.monthly * 0.5);
  const suggestedDwyOneTime = Math.round(midDwy + bumps.setup * 0.35);
  const suggestedDiy = inputs.diyIsFree ? 0 : Math.round(diyRange[1]);

  const totalFirstInvoiceEstimate = suggestedSetup + suggestedMonthly;
  let breakEvenMonthsVsPrice: number | null = null;
  if (projectedMonthlyRevenue > 0 && totalFirstInvoiceEstimate > 0) {
    breakEvenMonthsVsPrice = totalFirstInvoiceEstimate / projectedMonthlyRevenue;
  }

  const autoPositioningStatement = buildAutoPositioningStatement(
    inputs.positioningProblem,
    inputs.positioningSystem,
    inputs.positioningOutcome,
    row,
  );
  const outcomeStatementSnippet = buildOutcomeSnippet(row);

  const disclaimer =
    [DEFAULT_MARKET_DISCLAIMER, inputs.disclaimerCustom?.trim() ? ` ${inputs.disclaimerCustom.trim()}` : ""].join("");

  const checklistWarnings: string[] = [];
  if (inputs.seesClientMoneyPath === false) {
    checklistWarnings.push("Confirm the client can see how they make money with this offer.");
  }
  if (inputs.priceUnderOneToTwoMonthRoi === false) {
    checklistWarnings.push("Price may exceed 1–2× modeled monthly gross revenue—review positioning or price.");
  }
  if (inputs.adminPersonallyApproves === false) {
    checklistWarnings.push("Operator has not personally approved this offer for publication.");
  }

  const publishBlockedReasons: string[] = [...checklistWarnings];

  if (!inputs.agreementAccepted && (tier === "DFY" || tier === "DWY")) {
    publishBlockedReasons.push("Legal checklist / agreement not marked accepted for DFY/DWY.");
  }

  const internalReady =
    inputs.testedOnInternalBrand === true &&
    inputs.dataAvailableForOffer === true &&
    inputs.repeatableSystem === true;
  const internalReadiness = internalReady ? ("ready" as const) : ("unvalidated" as const);

  if (
    projectedMonthlyRevenue > 0 &&
    totalFirstInvoiceEstimate > 0 &&
    totalFirstInvoiceEstimate > projectedMonthlyRevenue * 2 &&
    inputs.priceUnderOneToTwoMonthRoi !== true
  ) {
    publishBlockedReasons.push("Modeled first invoice is more than 2× monthly gross—adjust or attest ROI check.");
  }

  const computed: AscendraPricingComputed = {
    projectedMonthlyRevenue,
    projectedAnnualRevenue,
    setupPriceRangeUsd: setupRange,
    monthlyPriceRangeUsd: monthlyRange,
    dwyPriceRangeUsd: dwyRange,
    diyPriceRangeUsd: diyRange,
    suggestedSetupUsd: suggestedSetup,
    suggestedMonthlyUsd: suggestedMonthly,
    suggestedDwyOneTimeUsd: suggestedDwyOneTime,
    suggestedDiyUsd: suggestedDiy,
    componentBumpSetupUsd: bumps.setup,
    componentBumpMonthlyUsd: bumps.monthly,
    breakEvenMonthsVsPrice,
    autoPositioningStatement,
    outcomeStatementSnippet,
    legalDisclaimerEffective: disclaimer,
    checklistWarnings,
    publishBlockedReasons: pkg.allowPublishOverride === true ? [] : publishBlockedReasons,
    internalReadiness,
  };

  const allowOverride = pkg.allowPublishOverride === true;
  const hasPublishBlocks = publishBlockedReasons.length > 0 && !allowOverride;
  const validationStatus = hasPublishBlocks
    ? ("publish_blocked" as const)
    : internalReadiness === "unvalidated"
      ? ("unvalidated" as const)
      : ("validated" as const);

  return {
    tierFocus: tier,
    allowPublishOverride: pkg.allowPublishOverride,
    validationStatus,
    inputs,
    computed,
  };
}

export function ensurePricingPackage(pkg: AscendraPricingPackage | null | undefined): AscendraPricingPackage {
  if (!pkg) return defaultAscendraPricingPackage();
  return {
    ...defaultAscendraPricingPackage(),
    ...pkg,
    inputs: { ...defaultAscendraPricingPackage().inputs, ...pkg.inputs },
  };
}

export function previewPricingForDraft(
  row: Pick<OfferEngineOfferTemplateRow, "coreProblem" | "primaryPromise" | "desiredOutcome" | "id" | "slug" | "name"> &
    Partial<OfferEngineOfferTemplateRow>,
  pkg: AscendraPricingPackage,
): AscendraPricingPackage | null {
  return refreshPricingPackageComputed(row as OfferEngineOfferTemplateRow, pkg);
}
