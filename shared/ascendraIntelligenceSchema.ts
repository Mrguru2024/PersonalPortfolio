/**
 * Ascendra Offer + Persona Intelligence Center — internal admin data.
 * Customer personas here are MARKETING TARGETS only (not app users).
 */
import {
  pgTable,
  text,
  serial,
  integer,
  json,
  timestamp,
} from "drizzle-orm/pg-core";

export const marketingPersonas = pgTable("marketing_personas", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  segment: text("segment"),
  revenueBand: text("revenue_band"),
  summary: text("summary"),
  /** Partner-level / strategic notes (e.g. Denishia). */
  strategicNote: text("strategic_note"),
  problemsJson: json("problems_json").$type<string[]>().notNull().default([]),
  goalsJson: json("goals_json").$type<string[]>().notNull().default([]),
  objectionsJson: json("objections_json").$type<string[]>().notNull().default([]),
  dynamicSignalsJson: json("dynamic_signals_json").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MarketingPersonaRow = typeof marketingPersonas.$inferSelect;
export type InsertMarketingPersonaRow = typeof marketingPersonas.$inferInsert;

export const SCRIPT_TEMPLATE_CATEGORIES = [
  "warm",
  "cold",
  "content",
  "follow_up",
  "objection",
  "generative_ai",
] as const;
export type ScriptTemplateCategory = (typeof SCRIPT_TEMPLATE_CATEGORIES)[number];

/** User-facing labels for script categories (admin UI). */
export const SCRIPT_CATEGORY_LABELS: Record<ScriptTemplateCategory, string> = {
  warm: "Warm",
  cold: "Cold",
  content: "Content",
  follow_up: "Follow-up",
  objection: "Objection",
  generative_ai: "Generative AI",
};

export const ascendraScriptTemplates = pgTable("ascendra_script_templates", {
  id: serial("id").primaryKey(),
  personaId: text("persona_id")
    .notNull()
    .references(() => marketingPersonas.id, { onDelete: "restrict" }),
  category: text("category").notNull(),
  name: text("name").notNull(),
  bodyMd: text("body_md").notNull().default(""),
  variablesJson: json("variables_json").$type<string[]>().notNull().default([]),
  /** draft | approved | published */
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AscendraScriptTemplateRow = typeof ascendraScriptTemplates.$inferSelect;
export type InsertAscendraScriptTemplateRow = typeof ascendraScriptTemplates.$inferInsert;

export const LEAD_MAGNET_TYPES = [
  "reveal_problems",
  "sample_trial",
  "one_step_system",
  "generative_ai",
] as const;
export type LeadMagnetType = (typeof LEAD_MAGNET_TYPES)[number];

/** User-facing labels for lead magnet types (admin UI). */
export const LEAD_MAGNET_TYPE_LABELS: Record<LeadMagnetType, string> = {
  reveal_problems: "Reveal problems",
  sample_trial: "Sample / trial",
  one_step_system: "One-step system",
  generative_ai: "Generative AI",
};

export const ascendraLeadMagnets = pgTable("ascendra_lead_magnets", {
  id: serial("id").primaryKey(),
  magnetType: text("magnet_type").notNull(),
  title: text("title").notNull(),
  hook: text("hook"),
  bodyMd: text("body_md"),
  /** Optional link to funnel_content_assets.id (no Drizzle FK — avoids schema cycles). */
  primaryAssetId: integer("primary_asset_id"),
  personaIdsJson: json("persona_ids_json").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AscendraLeadMagnetRow = typeof ascendraLeadMagnets.$inferSelect;
export type InsertAscendraLeadMagnetRow = typeof ascendraLeadMagnets.$inferInsert;
