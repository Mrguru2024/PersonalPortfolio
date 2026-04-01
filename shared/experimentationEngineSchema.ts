/**
 * Ascendra Experimentation Engine (AEE) — schema extensions for unified experimentation,
 * attribution rollups, and closed-loop CRM/PPC feedback. Reuses growth_experiments / growth_variants,
 * visitor_activity (+ metadata), ppc_performance_snapshots, ppc_lead_quality, and CRM tables.
 */
import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  json,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { growthExperiments, growthVariants, crmContacts, crmDeals } from "./crmSchema";
import { ppcCampaigns } from "./paidGrowthSchema";
import { commCampaigns } from "./communicationsSchema";

/** Targeting / audience rules for an experiment (geo, persona slices — evaluated in services). */
export const aeeExperimentTargets = pgTable("aee_experiment_targets", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id")
    .notNull()
    .references(() => growthExperiments.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  rulesJson: json("rules_json").$type<Record<string, unknown>>().notNull().default({}),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AeeExperimentTarget = typeof aeeExperimentTargets.$inferSelect;

/**
 * Daily (or backfilled) metrics per variant. dimensionKey default "total";
 * examples: persona:founder, region:US-CA, channel:google_ads, funnel:nurture
 */
export const aeeExperimentMetricsDaily = pgTable(
  "aee_experiment_metrics_daily",
  {
    id: serial("id").primaryKey(),
    workspaceKey: text("workspace_key").notNull().default("ascendra_main"),
    experimentId: integer("experiment_id")
      .notNull()
      .references(() => growthExperiments.id, { onDelete: "cascade" }),
    variantId: integer("variant_id")
      .notNull()
      .references(() => growthVariants.id, { onDelete: "cascade" }),
    metricDate: date("metric_date").notNull(),
    dimensionKey: text("dimension_key").notNull().default("total"),
    impressions: integer("impressions").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    ctaClicks: integer("cta_clicks").notNull().default(0),
    formSubmits: integer("form_submits").notNull().default(0),
    leads: integer("leads").notNull().default(0),
    bookedCalls: integer("booked_calls").notNull().default(0),
    proposals: integer("proposals").notNull().default(0),
    closedWon: integer("closed_won").notNull().default(0),
    closedLost: integer("closed_lost").notNull().default(0),
    revenueCents: integer("revenue_cents").notNull().default(0),
    /** Paid media cost in cents (synced from ppc_performance_snapshots or imports). */
    costCents: integer("cost_cents").notNull().default(0),
    visitors: integer("visitors").notNull().default(0),
    /** Evidence bundle (SQL/query refs, sample sizes) — no LLM narrative. */
    sourceRefsJson: json("source_refs_json").$type<Record<string, unknown>>().default({}),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("aee_metrics_daily_uidx").on(
      t.workspaceKey,
      t.experimentId,
      t.variantId,
      t.metricDate,
      t.dimensionKey,
    ),
  ],
);

export type AeeExperimentMetricsDaily = typeof aeeExperimentMetricsDaily.$inferSelect;

/** Evidence-based insight rows (population via deterministic rules, not generative “AI truth”). */
export const aeeExperimentInsights = pgTable("aee_experiment_insights", {
  id: serial("id").primaryKey(),
  workspaceKey: text("workspace_key").notNull().default("ascendra_main"),
  experimentId: integer("experiment_id").references(() => growthExperiments.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => growthVariants.id, { onDelete: "set null" }),
  insightType: text("insight_type").notNull(), // performance_gap | sample_size | revenue | persona | market | funnel | channel | campaign_health
  severity: text("severity").notNull().default("info"), // info | watch | fail
  title: text("title").notNull(),
  body: text("body").notNull(),
  evidenceJson: json("evidence_json").$type<Record<string, unknown>>().notNull().default({}),
  confidence0to100: integer("confidence_0to100").notNull().default(0),
  status: text("status").notNull().default("active"), // active | dismissed | archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AeeExperimentInsight = typeof aeeExperimentInsights.$inferSelect;

/** Links an experiment (and optional variant) to outbound channels — closes loop with PPC + email. */
export const aeeExperimentChannelLinks = pgTable("aee_experiment_channel_links", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id")
    .notNull()
    .references(() => growthExperiments.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => growthVariants.id, { onDelete: "cascade" }),
  /** web | google_ads | meta | email | social_organic | other */
  channelType: text("channel_type").notNull(),
  landingPath: text("landing_path"),
  ppcCampaignId: integer("ppc_campaign_id").references(() => ppcCampaigns.id, { onDelete: "set null" }),
  commCampaignId: integer("comm_campaign_id").references(() => commCampaigns.id, { onDelete: "set null" }),
  utmSnapshotJson: json("utm_snapshot_json").$type<Record<string, string>>().default({}),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AeeExperimentChannelLink = typeof aeeExperimentChannelLinks.$inferSelect;

/** CRM outcome events for attribution (supplement visitor_activity + deal stage transitions). */
export const aeeCrmAttributionEvents = pgTable("aee_crm_attribution_events", {
  id: serial("id").primaryKey(),
  workspaceKey: text("workspace_key").notNull().default("ascendra_main"),
  contactId: integer("contact_id")
    .notNull()
    .references(() => crmContacts.id, { onDelete: "cascade" }),
  dealId: integer("deal_id").references(() => crmDeals.id, { onDelete: "set null" }),
  visitorId: text("visitor_id"),
  experimentId: integer("experiment_id").references(() => growthExperiments.id, { onDelete: "set null" }),
  variantId: integer("variant_id").references(() => growthVariants.id, { onDelete: "set null" }),
  /** lead_created | booked_call | proposal | closed_won | closed_lost | revenue_adjustment */
  eventKind: text("event_kind").notNull(),
  valueCents: integer("value_cents").notNull().default(0),
  metadataJson: json("metadata_json").$type<Record<string, unknown>>().default({}),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AeeCrmAttributionEvent = typeof aeeCrmAttributionEvents.$inferSelect;

/** Normalized feedback signals (import hooks, webhooks, manual admin entries). */
export const aeeCampaignFeedbackSignals = pgTable("aee_campaign_feedback_signals", {
  id: serial("id").primaryKey(),
  workspaceKey: text("workspace_key").notNull().default("ascendra_main"),
  sourcePlatform: text("source_platform").notNull(),
  externalEntityId: text("external_entity_id"),
  signalType: text("signal_type").notNull(),
  payloadJson: json("payload_json").$type<Record<string, unknown>>().notNull().default({}),
  experimentId: integer("experiment_id").references(() => growthExperiments.id, { onDelete: "set null" }),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export type AeeCampaignFeedbackSignal = typeof aeeCampaignFeedbackSignals.$inferSelect;

export const aeeExperimentAuditLog = pgTable("aee_experiment_audit_log", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id")
    .notNull()
    .references(() => growthExperiments.id, { onDelete: "cascade" }),
  actorUserId: integer("actor_user_id"),
  action: text("action").notNull(),
  payloadJson: json("payload_json").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AeeExperimentAuditLogRow = typeof aeeExperimentAuditLog.$inferSelect;

/**
 * Optional granular paid-media stats when Google/Meta/API or file import provides them.
 * Campaign-level aggregates also live in ppc_performance_snapshots — prefer that when linked.
 */
export const aeePaidMediaDimensionStats = pgTable(
  "aee_paid_media_dimension_stats",
  {
    id: serial("id").primaryKey(),
    workspaceKey: text("workspace_key").notNull().default("ascendra_main"),
    platform: text("platform").notNull(),
    statDate: date("stat_date").notNull(),
    /** campaign | ad_group | ad | keyword */
    dimensionType: text("dimension_type").notNull(),
    /** Stable external id from the ad platform. */
    externalId: text("external_id").notNull(),
    parentExternalId: text("parent_external_id"),
    metricsJson: json("metrics_json").$type<Record<string, unknown>>().notNull().default({}),
    rawJson: json("raw_json").$type<Record<string, unknown>>().default({}),
    ppcCampaignId: integer("ppc_campaign_id").references(() => ppcCampaigns.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("aee_paid_dim_uidx").on(
      t.workspaceKey,
      t.platform,
      t.statDate,
      t.dimensionType,
      t.externalId,
    ),
  ],
);

export type AeePaidMediaDimensionStat = typeof aeePaidMediaDimensionStats.$inferSelect;
