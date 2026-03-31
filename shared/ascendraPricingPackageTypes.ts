/**
 * Ascendra Pricing & Offer System — structured package attached to offer_engine_offer_templates.
 * Value-first, legally explicit, admin-editable. Computed fields refreshed on save server-side.
 */
import { z } from "zod";

export const ASCENDRA_DELIVERY_TIER = ["DFY", "DWY", "DIY"] as const;
export type AscendraDeliveryTier = (typeof ASCENDRA_DELIVERY_TIER)[number];

export const TRIVIAL_LEVEL = ["low", "medium", "high"] as const;
export type TrivialLevel = (typeof TRIVIAL_LEVEL)[number];

/** System / delivery components (admin multi-select). */
export const SYSTEM_COMPONENT_KEYS = [
  "funnel_builder",
  "offer_creation",
  "lead_capture",
  "crm_setup",
  "booking_system",
  "ads_setup",
  "tracking_analytics",
  "optimization_engine",
] as const;
export type SystemComponentKey = (typeof SYSTEM_COMPONENT_KEYS)[number];

export const SYSTEM_COMPONENT_LABELS: Record<SystemComponentKey, string> = {
  funnel_builder: "Funnel Builder",
  offer_creation: "Offer Creation",
  lead_capture: "Lead Capture System",
  crm_setup: "CRM Setup",
  booking_system: "Booking System",
  ads_setup: "Ads Setup",
  tracking_analytics: "Tracking + Analytics",
  optimization_engine: "Optimization Engine",
};

/** Support layer selections. */
export const SUPPORT_COMPONENT_KEYS = [
  "strategy_calls",
  "training",
  "documentation",
  "ongoing_optimization",
] as const;
export type SupportComponentKey = (typeof SUPPORT_COMPONENT_KEYS)[number];

export const SUPPORT_COMPONENT_LABELS: Record<SupportComponentKey, string> = {
  strategy_calls: "Strategy Calls",
  training: "Training",
  documentation: "Documentation",
  ongoing_optimization: "Ongoing Optimization",
};

export const PAYMENT_STRUCTURE = ["full_upfront", "split_50_50", "milestones", "subscription"] as const;
export type PaymentStructure = (typeof PAYMENT_STRUCTURE)[number];

export const VALIDATION_STATUS = ["unvalidated", "validated", "publish_blocked"] as const;
export type OfferPricingValidationStatus = (typeof VALIDATION_STATUS)[number];

export const ascendraPricingInputsSchema = z.object({
  targetCustomer: z.string().max(2000).optional().nullable(),
  avgJobValue: z.number().min(0).max(50_000_000).optional().nullable(),
  targetJobsPerMonth: z.number().min(0).max(10_000).optional().nullable(),
  /** DFY */
  dfyComplexity: z.enum(TRIVIAL_LEVEL).optional().nullable(),
  dfyTimeRequired: z.enum(TRIVIAL_LEVEL).optional().nullable(),
  dfyRevenuePotential: z.enum(TRIVIAL_LEVEL).optional().nullable(),
  /** DWY */
  dwyGuidanceLevel: z.enum(TRIVIAL_LEVEL).optional().nullable(),
  dwyDuration: z.enum(TRIVIAL_LEVEL).optional().nullable(),
  dwyOutcomeClarity: z.enum(TRIVIAL_LEVEL).optional().nullable(),
  /** DIY */
  diyLowTicketCents: z.number().int().min(0).max(9900).optional().nullable(),
  diyIsFree: z.boolean().optional(),
  /** Value stack */
  systemComponents: z.array(z.enum(SYSTEM_COMPONENT_KEYS)).default([]),
  supportComponents: z.array(z.enum(SUPPORT_COMPONENT_KEYS)).default([]),
  /** Timeline (days) */
  setupDays: z.number().int().min(0).max(365).optional().nullable(),
  resultsWindowDays: z.number().int().min(0).max(730).optional().nullable(),
  optimizationPhaseNote: z.string().max(2000).optional().nullable(),
  /** Positioning — Problem → System → Outcome (admin editable) */
  positioningProblem: z.string().max(4000).optional().nullable(),
  positioningSystem: z.string().max(4000).optional().nullable(),
  positioningOutcome: z.string().max(4000).optional().nullable(),
  /** Manual price overrides (USD whole dollars); when set, used instead of band midpoint for display */
  setupPriceOverride: z.number().min(0).max(1_000_000).optional().nullable(),
  monthlyPriceOverride: z.number().min(0).max(500_000).optional().nullable(),
  /** Legal / agreement */
  disclaimerCustom: z.string().max(8000).optional().nullable(),
  includedCustom: z.array(z.string().max(500)).max(80).optional(),
  notIncludedCustom: z.array(z.string().max(500)).max(80).optional(),
  /** Agreement capture (admin / future client sign flow) */
  agreementAccepted: z.boolean().optional(),
  signeeLegalName: z.string().max(300).optional().nullable(),
  signatureCapturedAt: z.string().datetime().optional().nullable(),
  /** Value vs price checklist (admin attestation) */
  seesClientMoneyPath: z.boolean().optional(),
  priceUnderOneToTwoMonthRoi: z.boolean().optional(),
  adminPersonallyApproves: z.boolean().optional(),
  /** Internal gates */
  testedOnInternalBrand: z.boolean().optional(),
  dataAvailableForOffer: z.boolean().optional(),
  repeatableSystem: z.boolean().optional(),
  /** Stripe (optional IDs — products created in Stripe dashboard or future automation) */
  stripeProductId: z.string().max(120).optional().nullable(),
  stripePriceIdSetup: z.string().max(120).optional().nullable(),
  stripePriceIdMonthly: z.string().max(120).optional().nullable(),
  paymentStructure: z.enum(PAYMENT_STRUCTURE).optional().nullable(),
});

export type AscendraPricingInputs = z.infer<typeof ascendraPricingInputsSchema>;

export const ascendraPricingComputedSchema = z.object({
  projectedMonthlyRevenue: z.number().optional(),
  projectedAnnualRevenue: z.number().optional(),
  setupPriceRangeUsd: z.tuple([z.number(), z.number()]).optional(),
  monthlyPriceRangeUsd: z.tuple([z.number(), z.number()]).optional(),
  dwyPriceRangeUsd: z.tuple([z.number(), z.number()]).optional(),
  diyPriceRangeUsd: z.tuple([z.number(), z.number()]).optional(),
  /** Suggested display prices (midpoint unless overrides in inputs) */
  suggestedSetupUsd: z.number().optional(),
  suggestedMonthlyUsd: z.number().optional(),
  suggestedDwyOneTimeUsd: z.number().optional(),
  suggestedDiyUsd: z.number().optional(),
  componentBumpSetupUsd: z.number().optional(),
  componentBumpMonthlyUsd: z.number().optional(),
  breakEvenMonthsVsPrice: z.number().nullable().optional(),
  autoPositioningStatement: z.string().optional(),
  outcomeStatementSnippet: z.string().optional(),
  legalDisclaimerEffective: z.string().optional(),
  checklistWarnings: z.array(z.string()).optional(),
  publishBlockedReasons: z.array(z.string()).optional(),
  /** Repeatable delivery / data gates — restricts client-facing exposure when not ready. */
  internalReadiness: z.enum(["unvalidated", "ready"]).optional(),
});

export type AscendraPricingComputed = z.infer<typeof ascendraPricingComputedSchema>;

export const ascendraPricingPackageSchema = z.object({
  tierFocus: z.enum(ASCENDRA_DELIVERY_TIER).optional().nullable(),
  /** Publishing gate derived on save; admin can override with allowPublishOverride on package root. */
  validationStatus: z.enum(VALIDATION_STATUS).optional(),
  allowPublishOverride: z.boolean().optional(),
  inputs: ascendraPricingInputsSchema.default({}),
  computed: ascendraPricingComputedSchema.optional(),
});

export type AscendraPricingPackage = z.infer<typeof ascendraPricingPackageSchema>;

export const ascendraPricingPackageWriteSchema = ascendraPricingPackageSchema.partial().optional();

export function defaultAscendraPricingPackage(): AscendraPricingPackage {
  return {
    tierFocus: "DFY",
    inputs: {
      systemComponents: [],
      supportComponents: [],
      diyIsFree: false,
    },
    computed: {},
  };
}
