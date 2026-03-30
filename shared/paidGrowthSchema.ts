/**
 * Ascendra OS — Paid Growth / PPC module.
 * Integrates with site_offers, funnel paths, CRM, communications, and analytics — no parallel offer/CRM engines.
 */
import { pgTable, serial, text, timestamp, boolean, json, integer, real, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const PPC_PLATFORMS = ["google_ads", "meta"] as const;
export type PpcPlatform = (typeof PPC_PLATFORMS)[number];

export const PPC_CAMPAIGN_STATUSES = [
  "draft",
  "ready_for_review",
  "validation_failed",
  "approved",
  "publishing",
  "published",
  "paused",
  "archived",
  "sync_error",
] as const;
export type PpcCampaignStatus = (typeof PPC_CAMPAIGN_STATUSES)[number];

/** Logical ad account (tokens stay server env; this stores IDs + labels). */
export const ppcAdAccounts = pgTable("ppc_ad_accounts", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  nickname: text("nickname").notNull(),
  /** Google: customer ID (digits). Meta: numeric ad account id without act_ prefix. */
  externalAccountId: text("external_account_id").notNull(),
  /** Google MCC / manager customer id when applicable */
  managerCustomerId: text("manager_customer_id"),
  status: text("status").notNull().default("active"), // active | disconnected | error
  /** Business readiness: not_assessed | ad_ready | not_ad_ready (gates + assessment). */
  adReadyStatus: text("ad_ready_status").notNull().default("not_assessed"),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  isDefault: boolean("is_default").default(false),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPpcAdAccountSchema = createInsertSchema(ppcAdAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPpcAdAccount = z.infer<typeof insertPpcAdAccountSchema>;
export type PpcAdAccount = typeof ppcAdAccounts.$inferSelect;

export const ppcCampaigns = pgTable("ppc_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clientLabel: text("client_label"),
  platform: text("platform").notNull(),
  objective: text("objective").notNull().default("traffic"),
  /**
   * Modular PPC engine archetype — drives funnel posture, attribution horizon hints, call-tracking defaults.
   * See `shared/ppcCampaignModel.ts` (`CampaignModel`).
   */
  campaignModel: text("campaign_model").notNull().default("LEAD_GEN_FUNNEL"),
  status: text("status").notNull().default("draft"),
  offerSlug: text("offer_slug"),
  landingPagePath: text("landing_page_path").notNull().default("/"),
  thankYouPath: text("thank_you_path"),
  personaId: text("persona_id"),
  locationTargetingJson: json("location_targeting_json").$type<Record<string, unknown>>().default({}),
  budgetDailyCents: integer("budget_daily_cents"),
  scheduleJson: json("schedule_json").$type<Record<string, unknown>>().default({}),
  adCopyJson: json("ad_copy_json")
    .$type<{
      headline?: string;
      primaryText?: string;
      description?: string;
      cta?: string;
    }>()
    .default({}),
  creativeAssetUrls: json("creative_asset_urls").$type<string[]>().default([]),
  trackingParamsJson: json("tracking_params_json")
    .$type<{
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_content?: string;
      utm_term?: string;
    }>()
    .default({}),
  /** Optional Ascendra Communications campaign for nurture after lead capture */
  commCampaignId: integer("comm_campaign_id"),
  ppcAdAccountId: integer("ppc_ad_account_id"),
  platformCampaignId: text("platform_campaign_id"),
  platformAdSetId: text("platform_ad_set_id"),
  platformExtraJson: json("platform_extra_json").$type<Record<string, unknown>>().default({}),
  lastSyncError: text("last_sync_error"),
  lastSyncedAt: timestamp("last_synced_at"),
  readinessScore: integer("readiness_score"),
  readinessSnapshotJson: json("readiness_snapshot_json").$type<Record<string, unknown>>().default({}),
  publishPausedDefault: boolean("publish_paused_default").notNull().default(true),
  notes: text("notes"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPpcCampaignSchema = createInsertSchema(ppcCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  platformCampaignId: true,
  platformAdSetId: true,
  lastSyncError: true,
  lastSyncedAt: true,
  readinessScore: true,
  readinessSnapshotJson: true,
});
export type InsertPpcCampaign = z.infer<typeof insertPpcCampaignSchema>;
export type PpcCampaign = typeof ppcCampaigns.$inferSelect;

export const ppcPublishLogs = pgTable("ppc_publish_logs", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  platform: text("platform").notNull(),
  success: boolean("success").notNull().default(false),
  httpStatus: integer("http_status"),
  requestSummary: json("request_summary").$type<Record<string, unknown>>().default({}),
  responseSummary: json("response_summary").$type<Record<string, unknown>>().default({}),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PpcPublishLog = typeof ppcPublishLogs.$inferSelect;
export type InsertPpcPublishLog = typeof ppcPublishLogs.$inferInsert;

export const ppcPerformanceSnapshots = pgTable("ppc_performance_snapshots", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  snapshotDate: date("snapshot_date").notNull(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  spendCents: integer("spend_cents").default(0),
  conversions: integer("conversions").default(0),
  ctr: real("ctr"),
  cpcCents: integer("cpc_cents"),
  rawJson: json("raw_json").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PpcPerformanceSnapshot = typeof ppcPerformanceSnapshots.$inferSelect;
export type InsertPpcPerformanceSnapshot = typeof ppcPerformanceSnapshots.$inferInsert;

export const ppcLeadQuality = pgTable(
  "ppc_lead_quality",
  {
    id: serial("id").primaryKey(),
    crmContactId: integer("crm_contact_id").notNull(),
    ppcCampaignId: integer("ppc_campaign_id"),
    leadValid: boolean("lead_valid").default(true),
    fitScore: integer("fit_score"),
    spamFlag: boolean("spam_flag").default(false),
    bookedCall: boolean("booked_call").default(false),
    sold: boolean("sold").default(false),
    notes: text("notes"),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("ppc_lead_quality_contact_uidx").on(t.crmContactId)]
);

export const insertPpcLeadQualitySchema = createInsertSchema(ppcLeadQuality).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPpcLeadQuality = z.infer<typeof insertPpcLeadQualitySchema>;
export type PpcLeadQuality = typeof ppcLeadQuality.$inferSelect;

export const ppcReadinessAssessments = pgTable("ppc_readiness_assessments", {
  id: serial("id").primaryKey(),
  ppcCampaignId: integer("ppc_campaign_id"),
  scoresJson: json("scores_json").$type<Record<string, number>>().notNull(),
  blockersJson: json("blockers_json").$type<string[]>().notNull(),
  packageRecommendation: text("package_recommendation").notNull(),
  /** Aligns with `PpcGrowthRouteRecommendation` in ppcBusinessRules. */
  growthRouteRecommendation: text("growth_route_recommendation"),
  overallScore: integer("overall_score").notNull(),
  gatesJson: json("gates_json").$type<Record<string, boolean>>().notNull().default({}),
  remediationChecklistJson: json("remediation_checklist_json").$type<string[]>().notNull().default([]),
  adReady: boolean("ad_ready").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PpcReadinessAssessment = typeof ppcReadinessAssessments.$inferSelect;
export type InsertPpcReadinessAssessment = typeof ppcReadinessAssessments.$inferInsert;

export const PPC_AD_GROUP_STATUSES = ["draft", "active", "paused"] as const;
export type PpcAdGroupStatus = (typeof PPC_AD_GROUP_STATUSES)[number];

export const ppcAdGroups = pgTable("ppc_ad_groups", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id")
    .references(() => ppcCampaigns.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"),
  serviceCategory: text("service_category"),
  deviceSegmentJson: json("device_segment_json").$type<Record<string, unknown>>().default({}),
  sortOrder: integer("sort_order").default(0),
  strategyNotes: text("strategy_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PpcAdGroup = typeof ppcAdGroups.$inferSelect;
export type InsertPpcAdGroup = typeof ppcAdGroups.$inferInsert;

export const PPC_KEYWORD_MATCH_TYPES = ["exact", "phrase", "broad"] as const;
export type PpcKeywordMatchType = (typeof PPC_KEYWORD_MATCH_TYPES)[number];

export const ppcKeywords = pgTable("ppc_keywords", {
  id: serial("id").primaryKey(),
  adGroupId: integer("ad_group_id")
    .references(() => ppcAdGroups.id, { onDelete: "cascade" })
    .notNull(),
  keywordText: text("keyword_text").notNull(),
  matchType: text("match_type").notNull().default("phrase"),
  isNegative: boolean("is_negative").notNull().default(false),
  platformKeywordId: text("platform_keyword_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PpcKeyword = typeof ppcKeywords.$inferSelect;
export type InsertPpcKeyword = typeof ppcKeywords.$inferInsert;

export const PPC_DESTINATION_KINDS = ["primary", "fallback", "variant"] as const;
export type PpcDestinationKind = (typeof PPC_DESTINATION_KINDS)[number];

export const ppcCampaignDestinations = pgTable("ppc_campaign_destinations", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id")
    .references(() => ppcCampaigns.id, { onDelete: "cascade" })
    .notNull(),
  kind: text("kind").notNull().default("primary"),
  path: text("path").notNull(),
  offerSlug: text("offer_slug"),
  /** Relative weight for future A/B routing (100 = default). */
  weight: integer("weight").notNull().default(100),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PpcCampaignDestination = typeof ppcCampaignDestinations.$inferSelect;
export type InsertPpcCampaignDestination = typeof ppcCampaignDestinations.$inferInsert;

export const PPC_COPY_ANGLES = ["service", "urgency", "trust", "proof", "offer"] as const;
export type PpcCopyAngle = (typeof PPC_COPY_ANGLES)[number];

export const ppcAdCopyVariants = pgTable("ppc_ad_copy_variants", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id")
    .references(() => ppcCampaigns.id, { onDelete: "cascade" })
    .notNull(),
  adGroupId: integer("ad_group_id").references(() => ppcAdGroups.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  copyAngle: text("copy_angle").notNull().default("service"),
  headlinesJson: json("headlines_json").$type<string[]>().notNull().default([]),
  primaryTextsJson: json("primary_texts_json").$type<string[]>().notNull().default([]),
  descriptionsJson: json("descriptions_json").$type<string[]>().notNull().default([]),
  ctasJson: json("ctas_json").$type<string[]>().notNull().default([]),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PpcAdCopyVariant = typeof ppcAdCopyVariants.$inferSelect;
export type InsertPpcAdCopyVariant = typeof ppcAdCopyVariants.$inferInsert;

export const PPC_OPTIMIZATION_SEVERITIES = ["info", "warning", "critical"] as const;
export type PpcOptimizationSeverity = (typeof PPC_OPTIMIZATION_SEVERITIES)[number];

export const PPC_OPTIMIZATION_STATUSES = ["open", "applied", "dismissed", "snoozed"] as const;
export type PpcOptimizationStatus = (typeof PPC_OPTIMIZATION_STATUSES)[number];

export const ppcOptimizationRecommendations = pgTable(
  "ppc_optimization_recommendations",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id")
      .references(() => ppcCampaigns.id, { onDelete: "cascade" })
      .notNull(),
    ruleKey: text("rule_key").notNull(),
    severity: text("severity").notNull().default("warning"),
    status: text("status").notNull().default("open"),
    title: text("title").notNull(),
    detail: text("detail").notNull(),
    evidenceJson: json("evidence_json").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("ppc_opt_rec_campaign_rule_uidx").on(t.campaignId, t.ruleKey)]
);

export type PpcOptimizationRecommendation = typeof ppcOptimizationRecommendations.$inferSelect;
export type InsertPpcOptimizationRecommendation = typeof ppcOptimizationRecommendations.$inferInsert;

export const PPC_BILLING_MODELS = ["setup_only", "retainer", "performance", "hybrid"] as const;
export type PpcBillingModel = (typeof PPC_BILLING_MODELS)[number];

export const ppcBillingProfiles = pgTable("ppc_billing_profiles", {
  id: serial("id").primaryKey(),
  ppcAdAccountId: integer("ppc_ad_account_id").references(() => ppcAdAccounts.id, { onDelete: "set null" }),
  clientLabel: text("client_label"),
  billingModel: text("billing_model").notNull().default("hybrid"),
  setupFeeCents: integer("setup_fee_cents"),
  monthlyRetainerCents: integer("monthly_retainer_cents"),
  performanceBonusNotes: text("performance_bonus_notes"),
  laborEstimateHours: real("labor_estimate_hours"),
  internalProfitabilityScore: integer("internal_profitability_score"),
  fulfillmentNotes: text("fulfillment_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PpcBillingProfile = typeof ppcBillingProfiles.$inferSelect;
export type InsertPpcBillingProfile = typeof ppcBillingProfiles.$inferInsert;
