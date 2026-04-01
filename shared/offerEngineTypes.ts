import { z } from "zod";
import { ascendraPricingPackageSchema } from "./ascendraPricingPackageTypes";
import {
  BUYER_AWARENESS_STAGES,
  CTA_GOALS,
  EMOTIONAL_DRIVERS,
  LEAD_MAGNET_ENGINE_TYPES,
  LEAD_MAGNET_FORMATS,
  DELIVERY_METHODS,
  TRUST_PURPOSES,
  QUALIFICATION_INTENTS,
  OFFER_TYPES,
  PRICING_MODELS,
  RISK_REVERSAL_STYLES,
  TRUST_BUILDER_TYPES,
  ASSET_STATUSES,
  VISIBILITY_LEVELS,
  FUNNEL_STAGES,
  SCORE_TIERS,
} from "./offerEngineConstants";

/** Extended persona intelligence used by Offer Engine (stored in marketing_personas.offer_engine_strategy_json). */
export const personaStrategyLayerSchema = z.object({
  businessTypeLabel: z.string().optional(),
  revenueRange: z.string().optional(),
  mainFrustration: z.string().optional(),
  desiredOutcome: z.string().optional(),
  commonObjections: z.array(z.string()).optional(),
  trustTriggers: z.array(z.string()).optional(),
  buyingTriggers: z.array(z.string()).optional(),
  lowBudgetConcerns: z.array(z.string()).optional(),
  diyTendencies: z.array(z.string()).optional(),
  emotionalWordingPatterns: z.array(z.string()).optional(),
  preferredCtaStyle: z.string().optional(),
  preferredLeadMagnetTypes: z.array(z.string()).optional(),
  preferredOfferStyles: z.array(z.string()).optional(),
  urgencyStyle: z.string().optional(),
  proofSensitivity: z.string().optional(),
  commonFears: z.array(z.string()).optional(),
  badAlternativesTried: z.array(z.string()).optional(),
  timeToResultExpectations: z.string().optional(),
});
export type PersonaStrategyLayer = z.infer<typeof personaStrategyLayerSchema>;

export const strategyWhyConvertSchema = z.object({
  whyPersonaCares: z.string(),
  whyTheyCareNow: z.string(),
  whatTheyAlreadyTried: z.string(),
  whyMoreBelievableThanAlternatives: z.string(),
  frictionThatStillExists: z.string(),
  whatThisDoesNotSolve: z.string(),
  bestNextStepIfNotReady: z.string(),
});
export type StrategyWhyConvert = z.infer<typeof strategyWhyConvertSchema>;

export const bridgeToPaidSchema = z.object({
  helpsPersonaUnderstand: z.string(),
  smallWinItCreates: z.string(),
  doesNotFullySolve: z.string(),
  objectionsReduced: z.string(),
  paidStepItPointsTo: z.string(),
  ctaShouldComeNext: z.string(),
  whyNextStepFeelsNatural: z.string(),
});
export type BridgeToPaid = z.infer<typeof bridgeToPaidSchema>;

export const perceivedOutcomeReviewSchema = z.object({
  dreamOutcomeStatement: z.string(),
  currentPainStatement: z.string(),
  whyNowStatement: z.string(),
  trustReason: z.string(),
  believabilityNotes: z.string(),
  timeToValuePerception: z.string(),
  effortPerception: z.string(),
  keyFrictionPoints: z.string(),
  outcomeConfidenceNotes: z.string(),
  actionConfidenceNotes: z.string(),
});
export type PerceivedOutcomeReview = z.infer<typeof perceivedOutcomeReviewSchema>;

export const funnelAlignmentSchema = z.object({
  trafficSource: z.string(),
  audienceTemperature: z.string(),
  landingPageType: z.string(),
  conversionAction: z.string(),
  followUpAction: z.string(),
  crmTaggingLogic: z.string(),
  qualificationRoute: z.string(),
  nurtureSequenceRecommendation: z.string(),
  salesHandoffLogic: z.string(),
  finalConversionGoal: z.string(),
});
export type FunnelAlignment = z.infer<typeof funnelAlignmentSchema>;

export const funnelPathStepSchema = z.object({
  key: z.string(),
  label: z.string(),
  detail: z.string().optional(),
});
export type FunnelPathStep = z.infer<typeof funnelPathStepSchema>;

export const offerCopyBlocksSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  problemStatement: z.string().optional(),
  desiredResultStatement: z.string().optional(),
  whyNow: z.string().optional(),
  whyThisWorks: z.string().optional(),
  whyAscendra: z.string().optional(),
  deliverablesBlock: z.string().optional(),
  objectionReducer: z.string().optional(),
  ctaBlock: z.string().optional(),
  faqBlock: z.string().optional(),
  guaranteeSafeConfidenceBlock: z.string().optional(),
  valueStackBlock: z.string().optional(),
});
export type OfferCopyBlocks = z.infer<typeof offerCopyBlocksSchema>;

export const leadMagnetCopyBlocksSchema = z.object({
  hook: z.string().optional(),
  whyThisMatters: z.string().optional(),
  whoThisIsFor: z.string().optional(),
  whatTheyllGet: z.string().optional(),
  fastWinStatement: z.string().optional(),
  ctaBlock: z.string().optional(),
  whatHappensNext: z.string().optional(),
  bridgeToOfferBlock: z.string().optional(),
  followUpEmailIntro: z.string().optional(),
});
export type LeadMagnetCopyBlocks = z.infer<typeof leadMagnetCopyBlocksSchema>;

export const categoryScoresSchema = z.record(z.string(), z.number());
export type CategoryScores = z.infer<typeof categoryScoresSchema>;

export const scoreResultSchema = z.object({
  overall: z.number().min(0).max(100),
  categoryScores: categoryScoresSchema,
  weaknesses: z.array(z.string()),
  recommendedFixes: z.array(z.string()),
  tier: z.enum(SCORE_TIERS),
  confidenceNotes: z.string(),
  biggestConversionRisk: z.string(),
  bestImprovementLever: z.string(),
});
export type ScoreResult = z.infer<typeof scoreResultSchema>;

const emptyStrategyWhy: StrategyWhyConvert = {
  whyPersonaCares: "",
  whyTheyCareNow: "",
  whatTheyAlreadyTried: "",
  whyMoreBelievableThanAlternatives: "",
  frictionThatStillExists: "",
  whatThisDoesNotSolve: "",
  bestNextStepIfNotReady: "",
};

const emptyBridge: BridgeToPaid = {
  helpsPersonaUnderstand: "",
  smallWinItCreates: "",
  doesNotFullySolve: "",
  objectionsReduced: "",
  paidStepItPointsTo: "",
  ctaShouldComeNext: "",
  whyNextStepFeelsNatural: "",
};

const emptyPerceived: PerceivedOutcomeReview = {
  dreamOutcomeStatement: "",
  currentPainStatement: "",
  whyNowStatement: "",
  trustReason: "",
  believabilityNotes: "",
  timeToValuePerception: "",
  effortPerception: "",
  keyFrictionPoints: "",
  outcomeConfidenceNotes: "",
  actionConfidenceNotes: "",
};

const emptyFunnel: FunnelAlignment = {
  trafficSource: "",
  audienceTemperature: "",
  landingPageType: "",
  conversionAction: "",
  followUpAction: "",
  crmTaggingLogic: "",
  qualificationRoute: "",
  nurtureSequenceRecommendation: "",
  salesHandoffLogic: "",
  finalConversionGoal: "",
};

export function defaultStrategyWhyConvert(): StrategyWhyConvert {
  return { ...emptyStrategyWhy };
}
export function defaultBridgeToPaid(): BridgeToPaid {
  return { ...emptyBridge };
}
export function defaultPerceivedOutcomeReview(): PerceivedOutcomeReview {
  return { ...emptyPerceived };
}
export function defaultFunnelAlignment(): FunnelAlignment {
  return { ...emptyFunnel };
}

/** Analytics placeholder row (future instrumentation). */
export const analyticsMetricDefinitionSchema = z.object({
  metricKey: z.string(),
  description: z.string(),
  appliesTo: z.enum(["offer", "lead_magnet", "both"]),
  valueType: z.enum(["count", "rate", "currency", "ratio", "score"]).optional(),
});
export type AnalyticsMetricDefinition = z.infer<typeof analyticsMetricDefinitionSchema>;

export const offerTemplateWriteSchema = z.object({
  name: z.string().min(1).max(300),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "Lowercase slug (letters, numbers, hyphens)"),
  personaId: z.string().min(1).max(64),
  industryNiche: z.string().max(500).optional().nullable(),
  offerType: z.enum(OFFER_TYPES),
  buyerAwareness: z.enum(BUYER_AWARENESS_STAGES),
  coreProblem: z.string().max(20_000).optional().nullable(),
  desiredOutcome: z.string().max(20_000).optional().nullable(),
  emotionalDrivers: z.array(z.enum(EMOTIONAL_DRIVERS)).optional(),
  primaryPromise: z.string().max(20_000).optional().nullable(),
  tangibleDeliverables: z.string().max(50_000).optional().nullable(),
  timeToFirstWin: z.string().max(2000).optional().nullable(),
  trustBuilderType: z.enum(TRUST_BUILDER_TYPES),
  pricingModel: z.enum(PRICING_MODELS),
  riskReversalStyle: z.enum(RISK_REVERSAL_STYLES),
  ctaGoal: z.enum(CTA_GOALS),
  funnelEntryPoint: z.string().max(2000).optional().nullable(),
  funnelNextStep: z.string().max(2000).optional().nullable(),
  status: z.enum(ASSET_STATUSES).optional(),
  visibility: z.enum(VISIBILITY_LEVELS).optional(),
  strategyWhyConvert: strategyWhyConvertSchema.optional(),
  perceivedOutcomeReview: perceivedOutcomeReviewSchema.optional(),
  funnelAlignment: funnelAlignmentSchema.optional(),
  copyBlocks: offerCopyBlocksSchema.optional(),
  pricingPackage: ascendraPricingPackageSchema.nullable().optional(),
});

export const leadMagnetTemplateWriteSchema = z.object({
  name: z.string().min(1).max(300),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "Lowercase slug (letters, numbers, hyphens)"),
  personaId: z.string().min(1).max(64),
  relatedOfferTemplateId: z.number().int().positive().nullable().optional(),
  funnelStage: z.enum(FUNNEL_STAGES),
  leadMagnetType: z.enum(LEAD_MAGNET_ENGINE_TYPES),
  bigProblem: z.string().max(20_000).optional().nullable(),
  smallQuickWin: z.string().max(20_000).optional().nullable(),
  format: z.enum(LEAD_MAGNET_FORMATS),
  promiseHook: z.string().max(20_000).optional().nullable(),
  ctaAfterConsumption: z.string().max(2000).optional().nullable(),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  trustPurpose: z.enum(TRUST_PURPOSES),
  qualificationIntent: z.enum(QUALIFICATION_INTENTS),
  status: z.enum(ASSET_STATUSES).optional(),
  visibility: z.enum(VISIBILITY_LEVELS).optional(),
  bridgeToPaid: bridgeToPaidSchema.optional(),
  perceivedOutcomeReview: perceivedOutcomeReviewSchema.optional(),
  funnelAlignment: funnelAlignmentSchema.optional(),
  copyBlocks: leadMagnetCopyBlocksSchema.optional(),
});

export const funnelPathWriteSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "Lowercase slug (letters, numbers, hyphens)"),
  label: z.string().min(1).max(200),
  personaId: z.string().min(1).max(64),
  steps: z.array(funnelPathStepSchema).min(1),
  primaryOfferTemplateId: z.number().int().positive().nullable().optional(),
  primaryLeadMagnetTemplateId: z.number().int().positive().nullable().optional(),
});
