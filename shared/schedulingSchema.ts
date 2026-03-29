import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  json,
  timestamp,
  uniqueIndex,
  unique,
} from "drizzle-orm/pg-core";
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

/**
 * Conversion-focused public booking pages (Ascendra Scheduler). One page = one primary event type + funnel copy.
 * Future: payment capture, routing rules, scoped branding (see settingsJson).
 */
export const schedulingBookingPages = pgTable("scheduling_booking_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  shortDescription: text("short_description"),
  bestForBullets: json("best_for_bullets").$type<string[]>().default([]),
  bookingTypeId: integer("booking_type_id")
    .notNull()
    .references(() => schedulingBookingTypes.id, { onDelete: "restrict" }),
  /** When host_mode is fixed, public flow uses this approved admin as host. */
  fixedHostUserId: integer("fixed_host_user_id"),
  /** inherit | fixed — round_robin/collective reserved for Phase 2 routing engine */
  hostMode: text("host_mode").notNull().default("inherit"),
  locationType: text("location_type").notNull().default("video"),
  /** none | deposit | full — deposit/full collection wires to Stripe in Phase 2 */
  paymentRequirement: text("payment_requirement").notNull().default("none"),
  depositCents: integer("deposit_cents"),
  confirmationMessage: text("confirmation_message"),
  postBookingNextSteps: text("post_booking_next_steps"),
  redirectUrl: text("redirect_url"),
  formFieldsJson: json("form_fields_json")
    .$type<Array<{ id: string; label: string; type: "text" | "textarea"; required?: boolean }>>()
    .default([]),
  settingsJson: json("settings_json").$type<Record<string, unknown>>().default({}),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

/**
 * Per–approved-admin weekly windows for /book. When a host has rows for a weekday, those
 * windows are used instead of global availability for that host; empty → inherit global rules.
 */
export const schedulingHostWeeklyRules = pgTable("scheduling_host_weekly_rules", {
  id: serial("id").primaryKey(),
  /** Approved admin (`users.id`); no Drizzle FK to avoid schema circular imports. */
  userId: integer("user_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTimeLocal: text("start_time_local").notNull(),
  endTimeLocal: text("end_time_local").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Calendar dates (YYYY-MM-DD in business timezone) when a host is unavailable for booking. */
export const schedulingHostBlockedDates = pgTable(
  "scheduling_host_blocked_dates",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    dateLocal: text("date_local").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("scheduling_host_blocked_user_date_uq").on(t.userId, t.dateLocal)],
);

export const schedulingAppointments = pgTable(
  "scheduling_appointments",
  {
    id: serial("id").primaryKey(),
    bookingTypeId: integer("booking_type_id")
      .notNull()
      .references(() => schedulingBookingTypes.id, { onDelete: "restrict" }),
    /** Approved admin receiving the meeting; null = legacy rows before host tracking. */
    hostUserId: integer("host_user_id"),
    guestName: text("guest_name").notNull(),
    guestEmail: text("guest_email").notNull(),
    guestPhone: text("guest_phone"),
    guestCompany: text("guest_company"),
    bookingPageId: integer("booking_page_id").references(() => schedulingBookingPages.id, {
      onDelete: "set null",
    }),
    /** Ascendra Scheduler — operational tiers (Phase 1 heuristics; Phase 3 ML-ready). */
    leadScoreTier: text("lead_score_tier"),
    intentClassification: text("intent_classification"),
    noShowRiskTier: text("no_show_risk_tier"),
    paymentStatus: text("payment_status").notNull().default("none"),
    estimatedValueCents: integer("estimated_value_cents"),
    /** Page slug, UTM summary, or "native_booking" */
    bookingSource: text("booking_source"),
    formAnswersJson: json("form_answers_json").$type<Record<string, unknown>>().default({}),
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
export type SchedulingBookingPage = typeof schedulingBookingPages.$inferSelect;
export type SchedulingAvailabilityRule = typeof schedulingAvailabilityRules.$inferSelect;
export type SchedulingHostWeeklyRule = typeof schedulingHostWeeklyRules.$inferSelect;
export type SchedulingHostBlockedDate = typeof schedulingHostBlockedDates.$inferSelect;
export type SchedulingAppointment = typeof schedulingAppointments.$inferSelect;
export type SchedulingReminderJob = typeof schedulingReminderJobs.$inferSelect;

/** Per–approved-admin Google Calendar OAuth (native booking sync). */
export const schedulingAdminGoogleCalendar = pgTable(
  "scheduling_admin_google_calendar",
  {
    id: serial("id").primaryKey(),
    /** `users.id` of the admin who connected this calendar */
    userId: integer("user_id").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    configJson: json("config_json").$type<Record<string, unknown>>().notNull().default({}),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("scheduling_admin_google_calendar_user_uq").on(t.userId)],
);

export type SchedulingAdminGoogleCalendar = typeof schedulingAdminGoogleCalendar.$inferSelect;
export type SchedulingIntegrationConfig = typeof schedulingIntegrationConfigs.$inferSelect;
