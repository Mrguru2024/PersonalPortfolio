/**
 * Behavior Intelligence — session replay, heatmaps, surveys, user-testing notes, friction aggregates.
 * Complements visitor_activity + /api/track/visitor (lead events); stores richer behavioral payloads here.
 */
import { pgTable, serial, text, timestamp, boolean, json, integer, real, index, uniqueIndex } from "drizzle-orm/pg-core";
import { crmContacts } from "./crmSchema";

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
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("behavior_sessions_session_id_uidx").on(t.sessionId), index("behavior_sessions_crm_idx").on(t.crmContactId)],
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

export type BehaviorSession = typeof behaviorSessions.$inferSelect;
export type BehaviorEvent = typeof behaviorEvents.$inferSelect;
export type BehaviorReplaySegment = typeof behaviorReplaySegments.$inferSelect;
export type BehaviorHeatmapEvent = typeof behaviorHeatmapEvents.$inferSelect;
export type BehaviorSurvey = typeof behaviorSurveys.$inferSelect;
export type BehaviorFrictionReport = typeof behaviorFrictionReports.$inferSelect;
