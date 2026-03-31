/**
 * Behavior Intelligence — session replay, heatmaps, surveys, user-testing notes, friction aggregates.
 * Complements visitor_activity + /api/track/visitor (lead events); stores richer behavioral payloads here.
 */
import { pgTable, serial, text, timestamp, boolean, json, integer, real, index, uniqueIndex } from "drizzle-orm/pg-core";
import { crmContacts, growthExperiments } from "./crmSchema";
import { aosAgencyProjects } from "./agencyOsSchema";

/** Recorded visitor / session (distinct from CRM deals). Links optionally to CRM contact. */
export const behaviorSessions = pgTable(
  "behavior_sessions",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    /** Workspace / product key (e.g. ascendra_main). */
    businessId: text("business_id"),
    /** Client user id or anonymous id as string. */
    userId: text("user_id"),
    crmContactId: integer("crm_contact_id").references(() => crmContacts.id, { onDelete: "set null" }),
    startTime: timestamp("start_time").defaultNow().notNull(),
    endTime: timestamp("end_time"),
    device: text("device"),
    sourceJson: json("source_json").$type<Record<string, unknown>>(),
    converted: boolean("converted").default(false).notNull(),
    optOut: boolean("opt_out").default(false).notNull(),
    /** Exempt from automatic retention sweep (Ascendra OS storage policy). */
    retentionImportant: boolean("retention_important").default(false).notNull(),
    /** Long-term / legal hold–style flag — exempt from auto soft-delete. */
    retentionArchived: boolean("retention_archived").default(false).notNull(),
    /** Set by retention cron; row hidden from admin lists until restored (within grace) or hard-deleted. */
    softDeletedAt: timestamp("soft_deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("behavior_sessions_session_id_uidx").on(t.sessionId),
    index("behavior_sessions_crm_idx").on(t.crmContactId),
    index("behavior_sessions_soft_deleted_idx").on(t.softDeletedAt),
  ],
);

export const behaviorEvents = pgTable(
  "behavior_events",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    behaviorSessionId: integer("behavior_session_id").references(() => behaviorSessions.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    /** Client monotonic ms when available. */
    clientTs: integer("client_ts"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (t) => [index("behavior_events_session_idx").on(t.sessionId), index("behavior_events_type_idx").on(t.type)],
);

/** Chunks of rrweb events per session (ordered by seq). */
export const behaviorReplaySegments = pgTable(
  "behavior_replay_segments",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    behaviorSessionId: integer("behavior_session_id").references(() => behaviorSessions.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    payloadJson: json("payload_json").$type<unknown[]>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("behavior_replay_segments_session_idx").on(t.sessionId),
    uniqueIndex("behavior_replay_segments_session_seq_uidx").on(t.sessionId, t.seq),
  ],
);

export const behaviorHeatmapEvents = pgTable(
  "behavior_heatmap_events",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    page: text("page").notNull(),
    x: integer("x").notNull(),
    y: integer("y").notNull(),
    viewportW: integer("viewport_w"),
    viewportH: integer("viewport_h"),
    eventType: text("event_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("behavior_heatmap_page_idx").on(t.page), index("behavior_heatmap_session_idx").on(t.sessionId)],
);

/** Admin-authored surveys / micro-prompts (triggers enforced client-side + ingest). */
export const behaviorSurveys = pgTable("behavior_surveys", {
  id: serial("id").primaryKey(),
  businessId: text("business_id"),
  question: text("question").notNull(),
  /** exit_intent | time_based | scroll_based | form_abandon */
  triggerType: text("trigger_type").notNull().default("time_based"),
  triggerConfigJson: json("trigger_config_json").$type<Record<string, unknown>>(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const behaviorSurveyResponses = pgTable(
  "behavior_survey_responses",
  {
    id: serial("id").primaryKey(),
    surveyId: integer("survey_id")
      .notNull()
      .references(() => behaviorSurveys.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    response: text("response").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("behavior_survey_responses_survey_idx").on(t.surveyId)],
);

/** Aggregated friction signals per page (batch job). */
export const behaviorFrictionReports = pgTable(
  "behavior_friction_reports",
  {
    id: serial("id").primaryKey(),
    businessId: text("business_id"),
    page: text("page").notNull(),
    rageClicks: integer("rage_clicks").default(0).notNull(),
    deadClicks: integer("dead_clicks").default(0).notNull(),
    /** 0–1 approximate drop-off from form_start vs submit heuristic */
    dropOffRate: real("drop_off_rate"),
    summary: text("summary"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("behavior_friction_page_idx").on(t.page), index("behavior_friction_created_idx").on(t.createdAt)],
);

export const behaviorUserTestCampaigns = pgTable("behavior_user_test_campaigns", {
  id: serial("id").primaryKey(),
  businessId: text("business_id"),
  name: text("name").notNull(),
  hypothesis: text("hypothesis"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const behaviorUserTestObservations = pgTable(
  "behavior_user_test_observations",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id")
      .notNull()
      .references(() => behaviorUserTestCampaigns.id, { onDelete: "cascade" }),
    sessionId: text("session_id"),
    crmContactId: integer("crm_contact_id").references(() => crmContacts.id, { onDelete: "set null" }),
    notes: text("notes").notNull(),
    createdByUserId: integer("created_by_user_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("behavior_uto_campaign_idx").on(t.campaignId)],
);

/**
 * Admin-defined capture rules: path prefixes, replay/heatmap toggles, per-session caps, optional date window.
 * When at least one row is active and in window, the public tracker scopes capture to matching paths only.
 */
export const behaviorWatchTargets = pgTable(
  "behavior_watch_targets",
  {
    id: serial("id").primaryKey(),
    businessId: text("business_id"),
    name: text("name").notNull(),
    scopeType: text("scope_type").notNull().default("path_prefix"),
    fullUrlPrefix: text("full_url_prefix"),
    aosAgencyProjectId: integer("aos_agency_project_id").references(() => aosAgencyProjects.id, {
      onDelete: "set null",
    }),
    /** URL path prefix (e.g. `/pricing`) — always used for heatmap/replay SQL on this property. */
    pathPattern: text("path_pattern").notNull(),
    metadataJson: json("metadata_json").$type<Record<string, unknown>>().notNull().default({}),
    active: boolean("active").default(true).notNull(),
    recordReplay: boolean("record_replay").default(true).notNull(),
    recordHeatmap: boolean("record_heatmap").default(true).notNull(),
    /** Cap session recording length (minutes). Null = default 30. */
    maxSessionRecordingMinutes: integer("max_session_recording_minutes"),
    collectFrom: timestamp("collect_from"),
    collectUntil: timestamp("collect_until"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("behavior_watch_targets_active_idx").on(t.active),
    index("behavior_watch_targets_business_idx").on(t.businessId),
    index("behavior_watch_targets_aos_project_idx").on(t.aosAgencyProjectId),
  ],
);

/** Saved rollups for a path or target over a period; kept until admin deletes the row. */
export const behaviorWatchReports = pgTable(
  "behavior_watch_reports",
  {
    id: serial("id").primaryKey(),
    targetId: integer("target_id").references(() => behaviorWatchTargets.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    summaryJson: json("summary_json").$type<Record<string, unknown>>().notNull(),
    createdByUserId: integer("created_by_user_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("behavior_watch_reports_target_idx").on(t.targetId),
    index("behavior_watch_reports_period_idx").on(t.periodEnd),
  ],
);

export type BehaviorSession = typeof behaviorSessions.$inferSelect;
export type BehaviorEvent = typeof behaviorEvents.$inferSelect;
export type BehaviorReplaySegment = typeof behaviorReplaySegments.$inferSelect;
export type BehaviorHeatmapEvent = typeof behaviorHeatmapEvents.$inferSelect;
export type BehaviorSurvey = typeof behaviorSurveys.$inferSelect;
export type BehaviorFrictionReport = typeof behaviorFrictionReports.$inferSelect;
export type BehaviorWatchTarget = typeof behaviorWatchTargets.$inferSelect;
export type BehaviorWatchReport = typeof behaviorWatchReports.$inferSelect;

/**
 * Ascendra Growth Intelligence — operational tasks created from diagnostics / replay / friction.
 * Internal admin workflow; not shown on client Conversion Diagnostics unless explicitly shared.
 */
export const growthInsightTasks = pgTable(
  "growth_insight_tasks",
  {
    id: serial("id").primaryKey(),
    businessId: text("business_id"),
    title: text("title").notNull(),
    body: text("body"),
    status: text("status").notNull().default("open"),
    priority: text("priority").notNull().default("medium"),
    assigneeUserId: integer("assignee_user_id"),
    createdByUserId: integer("created_by_user_id"),
    evidenceJson: json("evidence_json").$type<Record<string, unknown>>().notNull().default({}),
    pagePath: text("page_path"),
    behaviorSessionKey: text("behavior_session_key"),
    surveyId: integer("survey_id"),
    heatmapPage: text("heatmap_page"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("growth_insight_tasks_status_idx").on(t.status),
    index("growth_insight_tasks_business_idx").on(t.businessId),
  ],
);

/** Links a task to Ascendra Experimentation Engine (AEE) experiments — pre/post metrics are advisory until stats engine exists. */
export const growthInsightExperimentLinks = pgTable(
  "growth_insight_experiment_links",
  {
    id: serial("id").primaryKey(),
    insightTaskId: integer("insight_task_id")
      .notNull()
      .references(() => growthInsightTasks.id, { onDelete: "cascade" }),
    growthExperimentId: integer("growth_experiment_id").references(() => growthExperiments.id, {
      onDelete: "set null",
    }),
    experimentKey: text("experiment_key"),
    variantNotes: text("variant_notes"),
    preMetricsJson: json("pre_metrics_json").$type<Record<string, unknown>>(),
    postMetricsJson: json("post_metrics_json").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("growth_insight_exp_links_task_idx").on(t.insightTaskId),
    index("growth_insight_exp_links_exp_idx").on(t.growthExperimentId),
  ],
);

export type GrowthInsightTask = typeof growthInsightTasks.$inferSelect;
export type GrowthInsightExperimentLink = typeof growthInsightExperimentLinks.$inferSelect;
