import {
  pgTable,
  serial,
  text,
  integer,
  json,
  timestamp,
  real,
  boolean,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Ascendra Market Research Engine (admin-only)
 * Structured project/run/findings/scoring/report persistence.
 */
export const marketResearchProjects = pgTable("market_research_projects", {
  id: serial("id").primaryKey(),
  projectKey: text("project_key").notNull().default("ascendra_main"),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  niche: text("niche").notNull(),
  service: text("service").notNull(),
  location: text("location").notNull(),
  keywords: json("keywords").$type<string[]>().notNull().default([]),
  competitors: json("competitors").$type<string[]>().notNull().default([]),
  subreddits: json("subreddits").$type<string[]>().notNull().default([]),
  sourcesEnabled: json("sources_enabled").$type<string[]>().notNull().default([]),
  notes: text("notes"),
  status: text("status").notNull().default("draft"), // draft | active | archived
  createdByUserId: integer("created_by_user_id"),
  updatedByUserId: integer("updated_by_user_id"),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MarketResearchProjectRow = typeof marketResearchProjects.$inferSelect;
export type InsertMarketResearchProjectRow = typeof marketResearchProjects.$inferInsert;

export const marketResearchRuns = pgTable(
  "market_research_runs",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => marketResearchProjects.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending | running | completed | failed
    triggerType: text("trigger_type").notNull().default("manual"), // manual | rerun | compare
    triggeredByUserId: integer("triggered_by_user_id"),
    inputSnapshotJson: json("input_snapshot_json").$type<Record<string, unknown>>().notNull().default({}),
    sourceExecutionJson: json("source_execution_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("market_research_runs_project_idx").on(t.projectId, t.createdAt)],
);

export type MarketResearchRunRow = typeof marketResearchRuns.$inferSelect;
export type InsertMarketResearchRunRow = typeof marketResearchRuns.$inferInsert;

export const marketResearchFindings = pgTable(
  "market_research_findings",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => marketResearchProjects.id, { onDelete: "cascade" }),
    runId: integer("run_id")
      .notNull()
      .references(() => marketResearchRuns.id, { onDelete: "cascade" }),
    sourceKey: text("source_key").notNull(),
    sourceLabel: text("source_label").notNull(),
    query: text("query"),
    content: text("content").notNull(),
    referenceUrl: text("reference_url"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
    confidence: real("confidence").notNull().default(0.5),
    fingerprint: text("fingerprint").notNull(),
    normalizedJson: json("normalized_json").$type<Record<string, unknown>>().notNull().default({}),
    metadataJson: json("metadata_json").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("market_research_findings_run_fingerprint_uidx").on(t.runId, t.fingerprint),
    index("market_research_findings_run_idx").on(t.runId, t.sourceKey),
  ],
);

export type MarketResearchFindingRow = typeof marketResearchFindings.$inferSelect;
export type InsertMarketResearchFindingRow = typeof marketResearchFindings.$inferInsert;

export const marketResearchScores = pgTable(
  "market_research_scores",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => marketResearchProjects.id, { onDelete: "cascade" }),
    runId: integer("run_id")
      .notNull()
      .references(() => marketResearchRuns.id, { onDelete: "cascade" }),
    dimensionKey: text("dimension_key").notNull(),
    numericScore: integer("numeric_score").notNull(),
    explanation: text("explanation").notNull(),
    evidenceFindingIds: json("evidence_finding_ids").$type<number[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("market_research_scores_run_dimension_uidx").on(t.runId, t.dimensionKey)],
);

export type MarketResearchScoreRow = typeof marketResearchScores.$inferSelect;
export type InsertMarketResearchScoreRow = typeof marketResearchScores.$inferInsert;

export const marketResearchRecommendations = pgTable(
  "market_research_recommendations",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => marketResearchProjects.id, { onDelete: "cascade" }),
    runId: integer("run_id")
      .notNull()
      .references(() => marketResearchRuns.id, { onDelete: "cascade" }),
    acquisitionChannel: text("acquisition_channel").notNull(),
    offerAngle: text("offer_angle").notNull(),
    contentStrategy: text("content_strategy").notNull(),
    funnelSuggestion: text("funnel_suggestion").notNull(),
    risks: json("risks").$type<string[]>().notNull().default([]),
    nextActions: json("next_actions").$type<string[]>().notNull().default([]),
    reasoning: text("reasoning").notNull(),
    evidenceFindingIds: json("evidence_finding_ids").$type<number[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("market_research_recommendations_run_uidx").on(t.runId)],
);

export type MarketResearchRecommendationRow = typeof marketResearchRecommendations.$inferSelect;
export type InsertMarketResearchRecommendationRow = typeof marketResearchRecommendations.$inferInsert;

export const marketResearchReports = pgTable(
  "market_research_reports",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => marketResearchProjects.id, { onDelete: "cascade" }),
    runId: integer("run_id")
      .notNull()
      .references(() => marketResearchRuns.id, { onDelete: "cascade" }),
    executiveSummary: text("executive_summary").notNull(),
    marketScore: integer("market_score").notNull(),
    confidenceLevel: text("confidence_level").notNull(), // low | medium | high
    decision: text("decision").notNull(), // pursue | test | wait | avoid
    reportJson: json("report_json").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("market_research_reports_run_uidx").on(t.runId)],
);

export type MarketResearchReportRow = typeof marketResearchReports.$inferSelect;
export type InsertMarketResearchReportRow = typeof marketResearchReports.$inferInsert;

export const marketResearchSourceConfigs = pgTable(
  "market_research_source_configs",
  {
    id: serial("id").primaryKey(),
    projectKey: text("project_key").notNull().default("ascendra_main"),
    sourceKey: text("source_key").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    setupStatus: text("setup_status").notNull().default("not_configured"),
    configJson: json("config_json").$type<Record<string, unknown>>().notNull().default({}),
    checklistJson: json("checklist_json").$type<string[]>().notNull().default([]),
    fallbackEnabled: boolean("fallback_enabled").notNull().default(true),
    lastTestedAt: timestamp("last_tested_at"),
    lastTestStatus: text("last_test_status"),
    lastTestMessage: text("last_test_message"),
    updatedByUserId: integer("updated_by_user_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique("market_research_source_configs_project_source_uidx").on(t.projectKey, t.sourceKey)],
);

export type MarketResearchSourceConfigRow = typeof marketResearchSourceConfigs.$inferSelect;
export type InsertMarketResearchSourceConfigRow = typeof marketResearchSourceConfigs.$inferInsert;

export const marketResearchManualEntries = pgTable(
  "market_research_manual_entries",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => marketResearchProjects.id, { onDelete: "cascade" }),
    runId: integer("run_id").references(() => marketResearchRuns.id, { onDelete: "set null" }),
    sourceKey: text("source_key").notNull().default("manual_input"),
    entryType: text("entry_type").notNull().default("note"),
    content: text("content").notNull(),
    tags: json("tags").$type<string[]>().notNull().default([]),
    referenceUrl: text("reference_url"),
    metadataJson: json("metadata_json").$type<Record<string, unknown>>().notNull().default({}),
    createdByUserId: integer("created_by_user_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("market_research_manual_entries_project_idx").on(t.projectId, t.createdAt)],
);

export type MarketResearchManualEntryRow = typeof marketResearchManualEntries.$inferSelect;
export type InsertMarketResearchManualEntryRow = typeof marketResearchManualEntries.$inferInsert;

export const marketResearchAuditLogs = pgTable(
  "market_research_audit_logs",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id").references(() => marketResearchProjects.id, { onDelete: "set null" }),
    runId: integer("run_id").references(() => marketResearchRuns.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    actorUserId: integer("actor_user_id"),
    detailsJson: json("details_json").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("market_research_audit_logs_created_idx").on(t.createdAt)],
);

export type MarketResearchAuditLogRow = typeof marketResearchAuditLogs.$inferSelect;
export type InsertMarketResearchAuditLogRow = typeof marketResearchAuditLogs.$inferInsert;

export const insertMarketResearchProjectSchema = createInsertSchema(marketResearchProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRunAt: true,
});
export type InsertMarketResearchProjectSchema = z.infer<typeof insertMarketResearchProjectSchema>;

export const insertMarketResearchManualEntrySchema = createInsertSchema(marketResearchManualEntries).omit({
  id: true,
  createdAt: true,
});
export type InsertMarketResearchManualEntrySchema = z.infer<typeof insertMarketResearchManualEntrySchema>;
