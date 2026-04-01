/**
 * Ascendra Market Intelligence Engine (AMIE) — admin-only persisted analyses.
 * Decision layer output is stored in amie_opportunity_report; raw signals in amie_market_data.
 */
import {
  pgTable,
  serial,
  text,
  integer,
  real,
  json,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { crmContacts } from "./crmSchema";

/** Saved market selection + run metadata */
export const amieMarketResearch = pgTable("amie_market_research", {
  id: serial("id").primaryKey(),
  projectKey: text("project_key").notNull().default("ascendra_main"),
  industry: text("industry").notNull(),
  serviceType: text("service_type").notNull(),
  location: text("location").notNull(),
  persona: text("persona").notNull(),
  createdByUserId: integer("created_by_user_id"),
  /** Lead captured from public funnel (e.g. Market Score); null = admin/saved only */
  crmContactId: integer("crm_contact_id").references(() => crmContacts.id, { onDelete: "set null" }),
  /** admin | market_score */
  funnelSource: text("funnel_source"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AmieMarketResearchRow = typeof amieMarketResearch.$inferSelect;

/** Normalized scores + structured payloads (1:1 with research) */
export const amieMarketData = pgTable(
  "amie_market_data",
  {
    id: serial("id").primaryKey(),
    researchId: integer("research_id")
      .notNull()
      .references(() => amieMarketResearch.id, { onDelete: "cascade" }),
    demandScore: integer("demand_score").notNull(),
    competitionScore: integer("competition_score").notNull(),
    purchasePowerScore: integer("purchase_power_score").notNull(),
    painScore: integer("pain_score").notNull(),
    targetingDifficulty: integer("targeting_difficulty").notNull(),
    /** growing | stable | declining */
    marketTrend: text("market_trend").notNull(),
    avgPrice: real("avg_price"),
    keywordData: json("keyword_data").$type<Record<string, unknown>>().notNull().default({}),
    trendData: json("trend_data").$type<Record<string, unknown>>().notNull().default({}),
    incomeData: json("income_data").$type<Record<string, unknown>>().notNull().default({}),
    competitionData: json("competition_data").$type<Record<string, unknown>>().notNull().default({}),
    sources: json("sources").$type<AmieSourceAttribution[]>().notNull().default([]),
    /** mock | live | mixed */
    dataMode: text("data_mode").notNull().default("mock"),
    computedAt: timestamp("computed_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("amie_market_data_research_id_uidx").on(t.researchId)],
);

export type AmieMarketDataRow = typeof amieMarketData.$inferSelect;

export type AmieSourceAttribution = {
  provider: string;
  label: string;
  retrievedAt: string;
  note?: string;
};

/** Strategy / decision layer (1:1 with research) */
export const amieOpportunityReport = pgTable(
  "amie_opportunity_report",
  {
    id: serial("id").primaryKey(),
    researchId: integer("research_id")
      .notNull()
      .references(() => amieMarketResearch.id, { onDelete: "cascade" }),
    summary: text("summary").notNull().default(""),
    insights: json("insights").$type<string[]>().notNull().default([]),
    recommendations: text("recommendations").notNull().default(""),
    personaStrategy: text("persona_strategy").notNull().default(""),
    leadStrategy: text("lead_strategy").notNull().default(""),
    funnelStrategy: text("funnel_strategy").notNull().default(""),
    adStrategy: text("ad_strategy").notNull().default(""),
    opportunityTier: text("opportunity_tier").notNull().default("medium"),
    rulesFired: json("rules_fired").$type<string[]>().notNull().default([]),
    /** Hooks for CRM / PPC / funnels (versioned shape) */
    integrationHintsJson: json("integration_hints_json").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("amie_opportunity_report_research_id_uidx").on(t.researchId)],
);

export type AmieOpportunityReportRow = typeof amieOpportunityReport.$inferSelect;

/** Brevo nurture for Market Score funnel: steps 2 and 3 (step 1 sends immediately). */
export const marketScoreNurtureJobs = pgTable(
  "market_score_nurture_jobs",
  {
    id: serial("id").primaryKey(),
    crmContactId: integer("crm_contact_id")
      .notNull()
      .references(() => crmContacts.id, { onDelete: "cascade" }),
    researchId: integer("research_id")
      .notNull()
      .references(() => amieMarketResearch.id, { onDelete: "cascade" }),
    step: integer("step").notNull(),
    runAt: timestamp("run_at").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("market_score_nurture_jobs_run_status_idx").on(t.runAt, t.status),
    index("market_score_nurture_jobs_contact_idx").on(t.crmContactId),
  ],
);

export type MarketScoreNurtureJobRow = typeof marketScoreNurtureJobs.$inferSelect;
