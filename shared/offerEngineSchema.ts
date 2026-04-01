/**
 * Ascendra Offer Engine — admin conversion-strategy templates (distinct from site_offers + ascendra_lead_magnets).
 */
import {
  pgTable,
  text,
  serial,
  integer,
  json,
  timestamp,
} from "drizzle-orm/pg-core";
import { marketingPersonas } from "./ascendraIntelligenceSchema";
import type {
  StrategyWhyConvert,
  PerceivedOutcomeReview,
  FunnelAlignment,
  OfferCopyBlocks,
  BridgeToPaid,
  LeadMagnetCopyBlocks,
  ScoreResult,
  FunnelPathStep,
} from "./offerEngineTypes";
import type { AscendraPricingPackage } from "./ascendraPricingPackageTypes";

/** Structured warnings + alignment flags computed on save/read. */
export type OfferEngineWarningPayload = {
  codes: string[];
  messages: string[];
  /** Softened copy hints when unsafe guarantee-adjacent language detected. */
  copySafetyFlags?: string[];
};

export const offerEngineOfferTemplates = pgTable("offer_engine_offer_templates", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  personaId: text("persona_id")
    .notNull()
    .references(() => marketingPersonas.id, { onDelete: "restrict" }),
  industryNiche: text("industry_niche"),
  offerType: text("offer_type").notNull(),
  buyerAwareness: text("buyer_awareness").notNull(),
  coreProblem: text("core_problem"),
  desiredOutcome: text("desired_outcome"),
  emotionalDriversJson: json("emotional_drivers_json").$type<string[]>().notNull().default([]),
  primaryPromise: text("primary_promise"),
  tangibleDeliverables: text("tangible_deliverables"),
  timeToFirstWin: text("time_to_first_win"),
  trustBuilderType: text("trust_builder_type").notNull(),
  pricingModel: text("pricing_model").notNull(),
  riskReversalStyle: text("risk_reversal_style").notNull(),
  ctaGoal: text("cta_goal").notNull(),
  funnelEntryPoint: text("funnel_entry_point"),
  funnelNextStep: text("funnel_next_step"),
  status: text("status").notNull().default("draft"),
  visibility: text("visibility").notNull().default("internal_only"),
  strategyWhyConvertJson: json("strategy_why_convert_json")
    .$type<StrategyWhyConvert>()
    .notNull(),
  perceivedOutcomeReviewJson: json("perceived_outcome_review_json")
    .$type<PerceivedOutcomeReview>()
    .notNull(),
  funnelAlignmentJson: json("funnel_alignment_json").$type<FunnelAlignment>().notNull(),
  copyBlocksJson: json("copy_blocks_json").$type<OfferCopyBlocks>().notNull().default({}),
  scoreCacheJson: json("score_cache_json").$type<ScoreResult | null>(),
  warningsJson: json("warnings_json").$type<OfferEngineWarningPayload | null>(),
  pricingPackageJson: json("pricing_package_json").$type<AscendraPricingPackage | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type OfferEngineOfferTemplateRow = typeof offerEngineOfferTemplates.$inferSelect;
export type InsertOfferEngineOfferTemplateRow = typeof offerEngineOfferTemplates.$inferInsert;

export const offerEngineLeadMagnetTemplates = pgTable("offer_engine_lead_magnet_templates", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  personaId: text("persona_id")
    .notNull()
    .references(() => marketingPersonas.id, { onDelete: "restrict" }),
  relatedOfferTemplateId: integer("related_offer_template_id").references(() => offerEngineOfferTemplates.id, {
    onDelete: "set null",
  }),
  funnelStage: text("funnel_stage").notNull(),
  leadMagnetType: text("lead_magnet_type").notNull(),
  bigProblem: text("big_problem"),
  smallQuickWin: text("small_quick_win"),
  format: text("format").notNull(),
  promiseHook: text("promise_hook"),
  ctaAfterConsumption: text("cta_after_consumption"),
  deliveryMethod: text("delivery_method").notNull(),
  trustPurpose: text("trust_purpose").notNull(),
  qualificationIntent: text("qualification_intent").notNull(),
  status: text("status").notNull().default("draft"),
  visibility: text("visibility").notNull().default("internal_only"),
  bridgeToPaidJson: json("bridge_to_paid_json").$type<BridgeToPaid>().notNull(),
  perceivedOutcomeReviewJson: json("perceived_outcome_review_json")
    .$type<PerceivedOutcomeReview>()
    .notNull(),
  funnelAlignmentJson: json("funnel_alignment_json").$type<FunnelAlignment>().notNull(),
  copyBlocksJson: json("copy_blocks_json").$type<LeadMagnetCopyBlocks>().notNull().default({}),
  scoreCacheJson: json("score_cache_json").$type<ScoreResult | null>(),
  warningsJson: json("warnings_json").$type<OfferEngineWarningPayload | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type OfferEngineLeadMagnetTemplateRow = typeof offerEngineLeadMagnetTemplates.$inferSelect;
export type InsertOfferEngineLeadMagnetTemplateRow = typeof offerEngineLeadMagnetTemplates.$inferInsert;

export const offerEngineFunnelPaths = pgTable("offer_engine_funnel_paths", {
  id: serial("id").primaryKey(),
  /** Stable key for idempotent seeding (e.g. funnel-marcus-starter). */
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  personaId: text("persona_id")
    .notNull()
    .references(() => marketingPersonas.id, { onDelete: "restrict" }),
  stepsJson: json("steps_json").$type<FunnelPathStep[]>().notNull(),
  primaryOfferTemplateId: integer("primary_offer_template_id").references(() => offerEngineOfferTemplates.id, {
    onDelete: "set null",
  }),
  primaryLeadMagnetTemplateId: integer("primary_lead_magnet_template_id").references(
    () => offerEngineLeadMagnetTemplates.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type OfferEngineFunnelPathRow = typeof offerEngineFunnelPaths.$inferSelect;
export type InsertOfferEngineFunnelPathRow = typeof offerEngineFunnelPaths.$inferInsert;

/** Placeholder metric definitions for future analytics wiring (no fake time-series). */
export const offerEngineAnalyticsMetricDefinitions = pgTable("offer_engine_analytics_metric_definitions", {
  id: serial("id").primaryKey(),
  metricKey: text("metric_key").notNull().unique(),
  description: text("description").notNull(),
  appliesTo: text("applies_to").notNull(),
  valueType: text("value_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OfferEngineAnalyticsMetricRow = typeof offerEngineAnalyticsMetricDefinitions.$inferSelect;
export type InsertOfferEngineAnalyticsMetricRow = typeof offerEngineAnalyticsMetricDefinitions.$inferInsert;
