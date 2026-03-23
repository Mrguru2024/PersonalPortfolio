import { pgTable, serial, text, integer, real, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const OFFER_VALUATION_CLIENT_EXPERIENCE_MODES = [
  "free_tool",
  "paid_product",
  "included_service",
] as const;

export type OfferValuationClientExperienceMode =
  (typeof OFFER_VALUATION_CLIENT_EXPERIENCE_MODES)[number];

export type OfferValuationBand = "low" | "mid" | "high";

export interface OfferValuationRecommendation {
  area: "dream_outcome" | "likelihood" | "time_delay" | "effort";
  title: string;
  action: string;
  priority: "high" | "medium" | "low";
}

export interface OfferValuationUpgradeSuggestions {
  positioningStatement: string;
  improvedOfferWording: string;
  suggestedBonuses: string[];
  suggestedGuarantee: string;
}

export interface OfferValuationInsights {
  band: OfferValuationBand;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  strategicRecommendations: OfferValuationRecommendation[];
  upgradeSuggestions: OfferValuationUpgradeSuggestions;
}

/** Offer Valuation Engine run output; one row per offer/persona test scenario. */
export const offerValuations = pgTable("offer_valuations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  persona: text("persona").notNull(),
  offerName: text("offer_name").notNull(),
  description: text("description"),
  dreamOutcomeScore: integer("dream_outcome_score").notNull(),
  likelihoodScore: integer("likelihood_score").notNull(),
  timeDelayScore: integer("time_delay_score").notNull(),
  effortScore: integer("effort_score").notNull(),
  finalScore: real("final_score").notNull(),
  insights: json("insights").$type<OfferValuationInsights>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Global Offer Valuation module settings (singleton row keyed by `default`). */
export const offerValuationModuleSettings = pgTable("offer_valuation_module_settings", {
  id: serial("id").primaryKey(),
  settingsKey: text("settings_key").notNull().default("default").unique(),
  clientExperienceMode: text("client_experience_mode").notNull().default("included_service"),
  updatedByUserId: integer("updated_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOfferValuationSchema = createInsertSchema(offerValuations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOfferValuationModuleSettingsSchema = createInsertSchema(
  offerValuationModuleSettings,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOfferValuation = z.infer<typeof insertOfferValuationSchema>;
export type OfferValuation = typeof offerValuations.$inferSelect;
export type InsertOfferValuationModuleSettings = z.infer<
  typeof insertOfferValuationModuleSettingsSchema
>;
export type OfferValuationModuleSettings = typeof offerValuationModuleSettings.$inferSelect;
