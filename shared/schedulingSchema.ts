import { pgTable, text, serial, integer, boolean, json, timestamp, uniqueIndex, unique } from "drizzle-orm/pg-core";
import { crmContacts } from "./crmSchema";

/**
 * Ascendra-native scheduling: availability, public booking, confirmations & reminder queue.
 * External calendars (Google, Calendly, etc.) are optional via integration config + env.
 */

export const schedulingGlobalSettings = pgTable("scheduling_global_settings", {
  id: integer("id").primaryKey().default(1),
  businessTimezone: text("business_timezone").notNull().default("America/New_York"),
  slotStepMinutes: integer("slot_step_minutes").notNull().default(30),
  minNoticeHours: integer("min_notice_hours").notNull().default(2),
  maxDaysAhead: integer("max_days_ahead").notNull().default(45),
  publicBookingEnabled: boolean("public_booking_enabled").notNull().default(true),
  aiAssistantEnabled: boolean("ai_assistant_enabled").notNull().default(true),
  confirmationEmailSubject: text("confirmation_email_subject"),
  confirmationEmailHtml: text("confirmation_email_html"),
  reminderEmailSubject: text("reminder_email_subject"),
  reminderEmailHtml: text("reminder_email_html"),
  /** Minutes before startAt to send each reminder (e.g. 1440 = 24h, 60 = 1h). */
  reminderOffsetsMinutes: json("reminder_offsets_minutes").$type<number[]>().default([1440, 60]),
  cancellationPolicyHtml: text("cancellation_policy_html"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const schedulingBookingTypes = pgTable("scheduling_booking_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schedulingAvailabilityRules = pgTable("scheduling_availability_rules", {
  id: serial("id").primaryKey(),
  /** When null, rule applies to every booking type. */
  bookingTypeId: integer("booking_type_id").references(() => schedulingBookingTypes.id, {
    onDelete: "cascade",
  }),
  /** 0 = Sunday … 6 = Saturday (JS getDay). */
  dayOfWeek: integer("day_of_week").notNull(),
  /** Local wall time in business timezone, HH:mm (24h). */
  startTimeLocal: text("start_time_local").notNull(),
  endTimeLocal: text("end_time_local").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schedulingAppointments = pgTable(
  "scheduling_appointments",
  {
    id: serial("id").primaryKey(),
    bookingTypeId: integer("booking_type_id")
      .notNull()
      .references(() => schedulingBookingTypes.id, { onDelete: "restrict" }),
    guestName: text("guest_name").notNull(),
    guestEmail: text("guest_email").notNull(),
    guestPhone: text("guest_phone"),
    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at").notNull(),
    status: text("status").notNull().default("confirmed"),
    /** Unique token for guest manage/cancel links. */
    guestToken: text("guest_token").notNull(),
    contactId: integer("contact_id").references(() => crmContacts.id, { onDelete: "set null" }),
    guestNotes: text("guest_notes"),
    internalNotes: text("internal_notes"),
    metadataJson: json("metadata_json").$type<Record<string, unknown>>(),
    confirmationSentAt: timestamp("confirmation_sent_at"),
    cancelledAt: timestamp("cancelled_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("scheduling_appointments_guest_token_uq").on(t.guestToken)],
);

export const schedulingReminderJobs = pgTable("scheduling_reminder_jobs", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id")
    .notNull()
    .references(() => schedulingAppointments.id, { onDelete: "cascade" }),
  /** reminder offset label e.g. "1440m" */
  kind: text("kind").notNull(),
  runAt: timestamp("run_at").notNull(),
  channel: text("channel").notNull().default("email"),
  processedAt: timestamp("processed_at"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Non-secret integration prefs; OAuth tokens stored encrypted in configJson (see server/lib/schedulingSecrets). */
export const schedulingIntegrationConfigs = pgTable(
  "scheduling_integration_configs",
  {
    id: serial("id").primaryKey(),
    provider: text("provider").notNull(),
    enabled: boolean("enabled").notNull().default(false),
    /** e.g. calendar id, encrypted refresh token blob, feature flags */
    configJson: json("config_json").$type<Record<string, unknown>>().default({}),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique("scheduling_integration_configs_provider_uq").on(t.provider)],
);

export type SchedulingGlobalSettings = typeof schedulingGlobalSettings.$inferSelect;
export type SchedulingBookingType = typeof schedulingBookingTypes.$inferSelect;
export type SchedulingAvailabilityRule = typeof schedulingAvailabilityRules.$inferSelect;
export type SchedulingAppointment = typeof schedulingAppointments.$inferSelect;
export type SchedulingReminderJob = typeof schedulingReminderJobs.$inferSelect;
export type SchedulingIntegrationConfig = typeof schedulingIntegrationConfigs.$inferSelect;
