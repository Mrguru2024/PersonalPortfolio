import {
  boolean,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { scarcityEngineConfigs } from "./scarcityEngineSchema";

/**
 * Urgency & Scarcity Conversion Engine — admin-configurable surfaces (lead magnets, tools, booking).
 *
 * Reuses: scarcity_engine_configs for real CRM/funnel capacity when capacitySource = scarcity_engine.
 * Reuses: visitor_activity (event types in leadTrackingTypes) for daily/weekly completion counts.
 *
 * Intentionally not rebuilt: duplicate scarcity math (delegates to modules/scarcity-engine).
 */
export const urgencyUrgencyModes = [
  "none",
  "batch_close",
  "daily_window",
  "weekly_review",
  "results_unlock",
  "early_access",
] as const;
export type UrgencyUrgencyMode = (typeof urgencyUrgencyModes)[number];

export const urgencyScarcityModes = [
  "none",
  "capacity",
  "qualified_access",
  "manual_review",
  "beta_pilot",
  "tool_unlock",
] as const;
export type UrgencyScarcityMode = (typeof urgencyScarcityModes)[number];

export const urgencyCapacitySources = ["none", "scarcity_engine", "daily_count", "weekly_count"] as const;
export type UrgencyCapacitySource = (typeof urgencyCapacitySources)[number];

export const urgencyCountDisplayModes = ["hidden", "exact", "approximate"] as const;
export type UrgencyCountDisplayMode = (typeof urgencyCountDisplayModes)[number];

export type UrgencyCtaVariant = {
  key: string;
  primaryText: string;
  subText?: string;
  href: string;
  urgencyBadge?: string;
  scarcityNote?: string;
  proofNote?: string;
};

export const urgencyConversionSurfaces = pgTable("urgency_conversion_surfaces", {
  id: serial("id").primaryKey(),
  /** Stable key e.g. startup-growth-kit, revenue-calculator */
  surfaceKey: text("surface_key").notNull().unique(),
  displayName: text("display_name").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  urgencyMode: text("urgency_mode").$type<UrgencyUrgencyMode>().notNull().default("none"),
  scarcityMode: text("scarcity_mode").$type<UrgencyScarcityMode>().notNull().default("none"),
  capacitySource: text("capacity_source").$type<UrgencyCapacitySource>().notNull().default("none"),
  scarcityEngineConfigId: integer("scarcity_engine_config_id").references(() => scarcityEngineConfigs.id, {
    onDelete: "set null",
  }),
  dailyCapacityMax: integer("daily_capacity_max"),
  weeklyCapacityMax: integer("weekly_capacity_max"),
  countDisplayMode: text("count_display_mode").$type<UrgencyCountDisplayMode>().notNull().default("exact"),
  /** Real batch / intake deadline (UTC). Timer UI only when set and in future. */
  batchEndsAt: timestamp("batch_ends_at"),
  /** Local end time HH:mm (24h) for daily_window mode */
  dailyWindowEndLocal: text("daily_window_end_local"),
  timezone: text("timezone").notNull().default("America/New_York"),
  /** Previous tool in Startup funnel chain — blocks access until completed in client progression */
  prerequisiteSurfaceKey: text("prerequisite_surface_key"),
  earlyAccessLabel: text("early_access_label"),
  qualificationFilterLabel: text("qualification_filter_label"),
  manualReviewLabel: text("manual_review_label"),
  proofTitle: text("proof_title"),
  proofBulletsJson: json("proof_bullets_json").$type<string[]>().notNull().default([]),
  lossTitle: text("loss_title"),
  lossBulletsJson: json("loss_bullets_json").$type<string[]>().notNull().default([]),
  defaultCtaVariantKey: text("default_cta_variant_key").notNull().default("default"),
  ctaVariantsJson: json("cta_variants_json").$type<UrgencyCtaVariant[]>().notNull().default([]),
  /** Optional Growth Intelligence experiment key for CTA/messaging A/B */
  growthExperimentKey: text("growth_experiment_key"),
  /** Passed to evaluateScarcityForContext when using engine-backed capacity */
  funnelSlugForScarcity: text("funnel_slug_for_scarcity"),
  offerSlugForScarcity: text("offer_slug_for_scarcity"),
  leadMagnetSlugForScarcity: text("lead_magnet_slug_for_scarcity"),
  analyticsEnabled: boolean("analytics_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUrgencyConversionSurfaceSchema = createInsertSchema(urgencyConversionSurfaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UrgencyConversionSurfaceRow = typeof urgencyConversionSurfaces.$inferSelect;
export type InsertUrgencyConversionSurfaceRow = z.infer<typeof insertUrgencyConversionSurfaceSchema>;
