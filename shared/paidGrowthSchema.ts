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
  overallScore: integer("overall_score").notNull(),
  gatesJson: json("gates_json").$type<Record<string, boolean>>().notNull().default({}),
  remediationChecklistJson: json("remediation_checklist_json").$type<string[]>().notNull().default([]),
  adReady: boolean("ad_ready").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PpcReadinessAssessment = typeof ppcReadinessAssessments.$inferSelect;
export type InsertPpcReadinessAssessment = typeof ppcReadinessAssessments.$inferInsert;
