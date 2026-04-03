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

export const scarcityConfigTypes = ["capacity", "cycle", "access", "performance"] as const;
export type ScarcityConfigType = (typeof scarcityConfigTypes)[number];

export const scarcityStatusValues = ["open", "limited", "full", "waitlist"] as const;
export type ScarcityStatus = (typeof scarcityStatusValues)[number];

export type ScarcityPerformanceThresholds = {
  conversionRateMin?: number;
  leadQualityMin?: number;
  revenueCentsMin?: number;
};

/**
 * Real scarcity controls used by funnels, offers, lead magnets, and campaigns.
 * Counts are computed from CRM/funnel records; currentUsage stores the latest computed snapshot.
 */
export const scarcityEngineConfigs = pgTable("scarcity_engine_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").$type<ScarcityConfigType>().notNull().default("capacity"),
  maxSlots: integer("max_slots").notNull().default(0),
  currentUsage: integer("current_usage").notNull().default(0),
  waitlistEnabled: boolean("waitlist_enabled").notNull().default(true),
  cycleDurationDays: integer("cycle_duration_days").notNull().default(30),
  cycleStartDate: timestamp("cycle_start_date"),
  personaLimit: text("persona_limit"),
  offerLimit: text("offer_limit"),
  leadMagnetLimit: text("lead_magnet_limit"),
  funnelLimit: text("funnel_limit"),
  qualificationThreshold: integer("qualification_threshold").notNull().default(60),
  performanceThresholdsJson: json("performance_thresholds_json")
    .$type<ScarcityPerformanceThresholds>()
    .notNull()
    .default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertScarcityEngineConfigSchema = createInsertSchema(scarcityEngineConfigs).omit({
  id: true,
  currentUsage: true,
  createdAt: true,
  updatedAt: true,
});

export type ScarcityEngineConfigRow = typeof scarcityEngineConfigs.$inferSelect;
export type InsertScarcityEngineConfigRow = z.infer<typeof insertScarcityEngineConfigSchema>;
