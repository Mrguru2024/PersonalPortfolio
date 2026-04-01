/**
 * Ascendra OS — Phase 2 Growth Engine (revenue, signals, automation, ROI, internal knowledge).
 * Extends Growth Intelligence without replacing behavior_* tables.
 */
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** Atomic revenue row: Stripe-linked, manual, or attributed from sessions. */
export const growthRevenueEvents = pgTable(
  "growth_revenue_events",
  {
    id: serial("id").primaryKey(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    /** stripe_invoice | stripe_payment | manual | attributed */
    source: text("source").notNull(),
    stripeInvoiceId: text("stripe_invoice_id"),
    stripePaymentId: text("stripe_payment_id"),
    crmContactId: integer("crm_contact_id"),
    behaviorSessionKey: text("behavior_session_key"),
    pagePath: text("page_path"),
    funnelSlug: text("funnel_slug"),
    ctaKey: text("cta_key"),
    formId: text("form_id"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    note: text("note"),
    metadataJson: json("metadata_json").$type<Record<string, unknown>>().notNull().default({}),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
    createdByUserId: integer("created_by_user_id"),
  },
  (t) => [
    index("growth_revenue_events_recorded_idx").on(t.recordedAt),
    index("growth_revenue_events_crm_idx").on(t.crmContactId),
    index("growth_revenue_events_stripe_inv_idx").on(t.stripeInvoiceId),
  ],
);

/** Real-time / near-real-time opportunity signals (admin-first; subset summarizable to clients). */
export const growthLeadSignals = pgTable(
  "growth_lead_signals",
  {
    id: serial("id").primaryKey(),
    signalType: text("signal_type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    /** low | medium | high */
    severity: text("severity").notNull().default("medium"),
    crmContactId: integer("crm_contact_id"),
    behaviorSessionId: integer("behavior_session_id"),
    behaviorSessionKey: text("behavior_session_key"),
    pagePath: text("page_path"),
    payloadJson: json("payload_json").$type<Record<string, unknown>>().notNull().default({}),
    readAt: timestamp("read_at"),
    dismissedAt: timestamp("dismissed_at"),
    notifyEmailSentAt: timestamp("notify_email_sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("growth_lead_signals_created_idx").on(t.createdAt),
    index("growth_lead_signals_session_idx").on(t.behaviorSessionId),
    index("growth_lead_signals_type_idx").on(t.signalType),
  ],
);

/** Event-triggered automation definitions (Brevo / CRM stage / task stubs). */
export const growthAutomationRules = pgTable(
  "growth_automation_rules",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    /** form_abandon | pricing_view | booking_view | high_intent | repeat_visit | cta_spike */
    triggerType: text("trigger_type").notNull(),
    delayMinutes: integer("delay_minutes").notNull().default(0),
    conditionsJson: json("conditions_json").$type<Record<string, unknown>>().notNull().default({}),
    actionsJson: json("actions_json").$type<Record<string, unknown>>().notNull().default({}),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("growth_automation_rules_trigger_idx").on(t.triggerType)],
);

export const growthAutomationRuns = pgTable(
  "growth_automation_runs",
  {
    id: serial("id").primaryKey(),
    ruleId: integer("rule_id")
      .notNull()
      .references(() => growthAutomationRules.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    runAfter: timestamp("run_after").notNull(),
    payloadJson: json("payload_json").$type<Record<string, unknown>>().notNull().default({}),
    resultJson: json("result_json").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("growth_automation_runs_due_idx").on(t.runAfter, t.status)],
);

/** Manual campaign spend for ROI (Google Ads etc. can be integrated later). */
export const growthCampaignCosts = pgTable(
  "growth_campaign_costs",
  {
    id: serial("id").primaryKey(),
    label: text("label").notNull(),
    channel: text("channel").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    note: text("note"),
    metadataJson: json("metadata_json").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdByUserId: integer("created_by_user_id"),
  },
  (t) => [index("growth_campaign_costs_period_idx").on(t.periodStart)],
);

/** Call tracking / verification (recording URL optional future). */
export const growthCallEvents = pgTable(
  "growth_call_events",
  {
    id: serial("id").primaryKey(),
    source: text("source").notNull(),
    durationSeconds: integer("duration_seconds"),
    /** qualified | not_qualified | missed | spam */
    verificationTag: text("verification_tag"),
    crmContactId: integer("crm_contact_id"),
    behaviorSessionKey: text("behavior_session_key"),
    pagePath: text("page_path"),
    trackingNumber: text("tracking_number"),
    note: text("note"),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
    createdByUserId: integer("created_by_user_id"),
  },
  (t) => [index("growth_call_events_recorded_idx").on(t.recordedAt)],
);

/** Internal-only learnings (admin). */
export const growthKnowledgeEntries = pgTable(
  "growth_knowledge_entries",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    industry: text("industry"),
    /** e.g. trades | beauty | saas | consultant */
    personaKey: text("persona_key"),
    tags: json("tags").$type<string[]>().notNull().default([]),
    worksWell: boolean("works_well").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdByUserId: integer("created_by_user_id"),
  },
  (t) => [index("growth_knowledge_industry_idx").on(t.industry)],
);

/** Visual funnel blueprint (DnD canvas); keyed e.g. startup | default. */
export const growthFunnelBlueprints = pgTable("growth_funnel_blueprints", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  nodesJson: json("nodes_json").$type<unknown[]>().notNull().default([]),
  edgesJson: json("edges_json").$type<unknown[]>().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GrowthRevenueEvent = typeof growthRevenueEvents.$inferSelect;
export type GrowthLeadSignal = typeof growthLeadSignals.$inferSelect;
export type GrowthAutomationRule = typeof growthAutomationRules.$inferSelect;
export type GrowthAutomationRun = typeof growthAutomationRuns.$inferSelect;
export type GrowthCampaignCost = typeof growthCampaignCosts.$inferSelect;
export type GrowthCallEvent = typeof growthCallEvents.$inferSelect;
export type GrowthKnowledgeEntry = typeof growthKnowledgeEntries.$inferSelect;
export type GrowthFunnelBlueprint = typeof growthFunnelBlueprints.$inferSelect;
