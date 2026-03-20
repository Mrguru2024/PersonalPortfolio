/**
 * Internal Content Studio + $100M Leads alignment audit + editorial calendar + publish workflow.
 * Admin-only surfaces; tied to Ascendra monolith (not a separate app).
 */
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  json,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ——— A. Lead alignment audit ($100M Leads style) ———

export const internalAuditRuns = pgTable("internal_audit_runs", {
  id: serial("id").primaryKey(),
  projectKey: text("project_key").notNull().default("ascendra_main"),
  label: text("label"),
  status: text("status").notNull().default("pending"), // pending | running | completed | failed
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  triggeredByUserId: integer("triggered_by_user_id"),
  /** High-level rollup + engine metadata. */
  summaryJson: json("summary_json").$type<Record<string, unknown>>(),
  /** Pre-built sanitized summary for future client APIs (never auto-public). */
  clientSafeSummaryJson: json("client_safe_summary_json").$type<Record<string, unknown>>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InternalAuditRun = typeof internalAuditRuns.$inferSelect;

export const internalAuditScores = pgTable(
  "internal_audit_scores",
  {
    id: serial("id").primaryKey(),
    runId: integer("run_id")
      .notNull()
      .references(() => internalAuditRuns.id, { onDelete: "cascade" }),
    categoryKey: text("category_key").notNull(),
    score: integer("score").notNull(),
    /** strength | weakness | mixed | unknown */
    strengthState: text("strength_state").notNull().default("unknown"),
    whyItMatters: text("why_it_matters"),
    risk: text("risk"),
    /** p0 | p1 | p2 | p3 */
    implementationPriority: text("implementation_priority").notNull().default("p2"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("internal_audit_scores_run_category").on(t.runId, t.categoryKey)],
);

export type InternalAuditScore = typeof internalAuditScores.$inferSelect;

export const internalAuditRecommendations = pgTable("internal_audit_recommendations", {
  id: serial("id").primaryKey(),
  runId: integer("run_id")
    .notNull()
    .references(() => internalAuditRuns.id, { onDelete: "cascade" }),
  categoryKey: text("category_key").notNull(),
  title: text("title").notNull(),
  detail: text("detail"),
  relatedPaths: json("related_paths").$type<string[]>().default([]),
  /** p0 | p1 | p2 | p3 */
  priority: text("priority").notNull().default("p2"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InternalAuditRecommendation = typeof internalAuditRecommendations.$inferSelect;

// ——— B. Campaigns & CMS documents ———

export const internalContentCampaigns = pgTable("internal_content_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  goal: text("goal"),
  projectKey: text("project_key").notNull().default("ascendra_main"),
  startAt: timestamp("start_at"),
  endAt: timestamp("end_at"),
  status: text("status").notNull().default("draft"), // draft | active | completed | archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InternalContentCampaign = typeof internalContentCampaigns.$inferSelect;

export const internalContentTemplates = pgTable("internal_content_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  bodyHtml: text("body_html").notNull().default(""),
  variablesJson: json("variables_json").$type<string[]>().default([]),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InternalContentTemplate = typeof internalContentTemplates.$inferSelect;

/** Unified internal CMS entity (all copy / library types). */
export const internalCmsDocuments = pgTable("internal_cms_documents", {
  id: serial("id").primaryKey(),
  /** blog_draft | short_form | micro_post | social_caption | newsletter_draft | lead_magnet_draft | landing_copy | campaign_brief | hook | headline | cta */
  contentType: text("content_type").notNull(),
  title: text("title").notNull(),
  slug: text("slug"),
  bodyHtml: text("body_html").notNull().default(""),
  bodyMarkdown: text("body_markdown"),
  excerpt: text("excerpt"),
  tags: json("tags").$type<string[]>().default([]),
  categories: json("categories").$type<string[]>().default([]),
  personaTags: json("persona_tags").$type<string[]>().default([]),
  funnelStage: text("funnel_stage"),
  offerSlug: text("offer_slug"),
  leadMagnetSlug: text("lead_magnet_slug"),
  campaignId: integer("campaign_id").references(() => internalContentCampaigns.id, {
    onDelete: "set null",
  }),
  projectKey: text("project_key").notNull().default("ascendra_main"),
  platformTargets: json("platform_targets").$type<string[]>().default([]),
  /** draft | staged | scheduled | published | failed | archived */
  workflowStatus: text("workflow_status").notNull().default("draft"),
  /** internal_only | client_visible | public_visible */
  visibility: text("visibility").notNull().default("internal_only"),
  /** none | pending | approved | rejected */
  approvalStatus: text("approval_status").notNull().default("none"),
  templateId: integer("template_id").references(() => internalContentTemplates.id, {
    onDelete: "set null",
  }),
  contentBlocks: json("content_blocks").$type<Record<string, unknown>>().default({}),
  scheduledPublishAt: timestamp("scheduled_publish_at"),
  publishedAt: timestamp("published_at"),
  lastEditedByUserId: integer("last_edited_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInternalCmsDocumentSchema = createInsertSchema(internalCmsDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInternalCmsDocument = z.infer<typeof insertInternalCmsDocumentSchema>;

export type InternalCmsDocument = typeof internalCmsDocuments.$inferSelect;

// ——— C. Editorial calendar ———

export const internalEditorialCalendarEntries = pgTable("internal_editorial_calendar_entries", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => internalCmsDocuments.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  endAt: timestamp("end_at"),
  timezone: text("timezone").notNull().default("UTC"),
  /** draft | scheduled | published | skipped */
  calendarStatus: text("calendar_status").notNull().default("draft"),
  platformTargets: json("platform_targets").$type<string[]>().default([]),
  personaTags: json("persona_tags").$type<string[]>().default([]),
  ctaObjective: text("cta_objective"),
  funnelStage: text("funnel_stage"),
  campaignId: integer("campaign_id").references(() => internalContentCampaigns.id, {
    onDelete: "set null",
  }),
  projectKey: text("project_key").notNull().default("ascendra_main"),
  /** Sort within same scheduled day (drag order). */
  sortOrder: integer("sort_order").notNull().default(0),
  warningsJson: json("warnings_json").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InternalEditorialCalendarEntry = typeof internalEditorialCalendarEntries.$inferSelect;

// ——— D. Workflow / publish foundation ———

export const internalPublishLogs = pgTable("internal_publish_logs", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => internalCmsDocuments.id, {
    onDelete: "set null",
  }),
  calendarEntryId: integer("calendar_entry_id").references(() => internalEditorialCalendarEntries.id, {
    onDelete: "set null",
  }),
  /** Adapter key: manual | blog | newsletter | social_placeholder */
  platform: text("platform").notNull(),
  status: text("status").notNull().default("pending"), // pending | success | failed | skipped
  requestPayload: json("request_payload").$type<Record<string, unknown>>(),
  responsePayload: json("response_payload").$type<Record<string, unknown>>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InternalPublishLog = typeof internalPublishLogs.$inferSelect;

export const internalContentEditHistory = pgTable("internal_content_edit_history", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .notNull()
    .references(() => internalCmsDocuments.id, { onDelete: "cascade" }),
  editorUserId: integer("editor_user_id"),
  snapshotJson: json("snapshot_json").$type<Record<string, unknown>>().notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InternalContentEditHistory = typeof internalContentEditHistory.$inferSelect;

/** Registered platform adapters (scaffold for Buffer-style integrations). */
export const internalPlatformAdapters = pgTable("internal_platform_adapters", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  displayName: text("display_name").notNull(),
  config: json("config").$type<Record<string, unknown>>().default({}),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InternalPlatformAdapter = typeof internalPlatformAdapters.$inferSelect;
