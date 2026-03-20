/**
 * Growth OS Phase 3 — AI content insights, research intelligence, automation runs.
 * Admin-only data paths; client exposure only via gosExposurePolicies + token shares.
 */
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  json,
  timestamp,
  real,
} from "drizzle-orm/pg-core";
import { internalCmsDocuments, internalEditorialCalendarEntries } from "./internalStudioSchema";

export const internalContentInsightRuns = pgTable("internal_content_insight_runs", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => internalCmsDocuments.id, { onDelete: "cascade" }),
  calendarEntryId: integer("calendar_entry_id").references(() => internalEditorialCalendarEntries.id, {
    onDelete: "set null",
  }),
  projectKey: text("project_key").notNull().default("ascendra_main"),
  /** manual | on_save | on_schedule | automation */
  triggerType: text("trigger_type").notNull().default("manual"),
  /** live | mock */
  providerMode: text("provider_mode").notNull().default("mock"),
  status: text("status").notNull().default("pending"), // pending | completed | failed
  /** Never expose to client routes — model metadata, raw fragments, consolidated internal rationale. */
  internalMetadataJson: json("internal_metadata_json").$type<Record<string, unknown>>().default({}),
  errorMessage: text("error_message"),
  triggeredByUserId: integer("triggered_by_user_id"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type InternalContentInsightRun = typeof internalContentInsightRuns.$inferSelect;

export const internalContentInsightScores = pgTable("internal_content_insight_scores", {
  id: serial("id").primaryKey(),
  runId: integer("run_id")
    .notNull()
    .references(() => internalContentInsightRuns.id, { onDelete: "cascade" }),
  dimensionKey: text("dimension_key").notNull(),
  score: integer("score").notNull(),
  /** Internal-only explanation of the score; not shown in client-safe views. */
  internalRationale: text("internal_rationale"),
  /** Optional short label safe for future client-facing summaries (no methodology). */
  clientSafeHint: text("client_safe_hint"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InternalContentInsightScore = typeof internalContentInsightScores.$inferSelect;

export const internalContentAiSuggestions = pgTable("internal_content_ai_suggestions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .notNull()
    .references(() => internalCmsDocuments.id, { onDelete: "cascade" }),
  insightRunId: integer("insight_run_id").references(() => internalContentInsightRuns.id, {
    onDelete: "set null",
  }),
  /** stronger_hook | headline | cta | pain_framing | outcome_phrasing | platform_variant | repurpose | other */
  suggestionKind: text("suggestion_kind").notNull().default("other"),
  platformTarget: text("platform_target"),
  title: text("title").notNull(),
  /** Full internal suggestion copy / rationale bundle. */
  body: text("body").notNull().default(""),
  /** Short excerpt allowed in future client deliverables (still review before share). */
  clientSafeExcerpt: text("client_safe_excerpt"),
  /** Traceability: prompt id, model, chunk refs — internal only. */
  internalTraceJson: json("internal_trace_json").$type<Record<string, unknown>>().default({}),
  /** pending | accepted | rejected | edited | dismissed */
  reviewStatus: text("review_status").notNull().default("pending"),
  editedBody: text("edited_body"),
  reviewedByUserId: integer("reviewed_by_user_id"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InternalContentAiSuggestion = typeof internalContentAiSuggestions.$inferSelect;

export const internalResearchBatches = pgTable("internal_research_batches", {
  id: serial("id").primaryKey(),
  projectKey: text("project_key").notNull().default("ascendra_main"),
  label: text("label"),
  /** live | mock */
  providerMode: text("provider_mode").notNull().default("mock"),
  querySeed: text("query_seed"),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InternalResearchBatch = typeof internalResearchBatches.$inferSelect;

export const internalResearchItems = pgTable("internal_research_items", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").references(() => internalResearchBatches.id, { onDelete: "cascade" }),
  /** keyword | topic | phrase | headline_opportunity | angle | seasonal | platform_relevance */
  itemKind: text("item_kind").notNull(),
  phrase: text("phrase").notNull(),
  source: text("source").notNull().default("mock"),
  confidence: real("confidence").notNull().default(0.5),
  /** up | down | flat | unknown */
  trendDirection: text("trend_direction").notNull().default("unknown"),
  relevanceScore: integer("relevance_score").notNull().default(50),
  audienceFit: text("audience_fit"),
  suggestedUsage: text("suggested_usage"),
  relatedHeadlines: json("related_headlines").$type<string[]>().default([]),
  relatedCtaOpportunities: json("related_cta_opportunities").$type<string[]>().default([]),
  metadataJson: json("metadata_json").$type<Record<string, unknown>>().default({}),
  projectKey: text("project_key").notNull().default("ascendra_main"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InternalResearchItem = typeof internalResearchItems.$inferSelect;

export const internalAutomationRuns = pgTable("internal_automation_runs", {
  id: serial("id").primaryKey(),
  /** content_insight_save | content_insight_schedule | audit_engine | weekly_research_digest | editorial_gap | stale_content | stale_followup | headline_variants */
  jobType: text("job_type").notNull(),
  status: text("status").notNull().default("pending"), // pending | running | completed | failed
  payloadJson: json("payload_json").$type<Record<string, unknown>>().default({}),
  resultSummary: text("result_summary"),
  relatedDocumentId: integer("related_document_id"),
  relatedCalendarEntryId: integer("related_calendar_entry_id"),
  triggeredByUserId: integer("triggered_by_user_id"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type InternalAutomationRun = typeof internalAutomationRuns.$inferSelect;
