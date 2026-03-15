import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  json,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/** CRM contact/lead: unified record for leads and clients with high-value fields */
export const crmContacts = pgTable("crm_contacts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("lead"), // lead | client
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("job_title"),
  industry: text("industry"),
  source: text("source"), // website, referral, linkedin, etc.
  status: text("status").default("new"), // new, contacted, qualified, proposal, negotiation, won, lost
  estimatedValue: integer("estimated_value"), // cents or deal size
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),
  customFields: json("custom_fields").$type<Record<string, unknown>>(),
  // Link to legacy contact form submission if imported
  contactId: integer("contact_id"),
  stripeCustomerId: text("stripe_customer_id"),
  // Lead intelligence: score 0–100, intent label for prioritization
  leadScore: integer("lead_score"), // 0–100, updated from engagement signals
  intentLevel: text("intent_level"), // low_intent | moderate_intent | high_intent | hot_lead
  // Apollo-style: LinkedIn and enrichment
  linkedinUrl: text("linkedin_url"),
  enrichmentStatus: text("enrichment_status"), // pending | enriched | failed | none
  enrichedAt: timestamp("enriched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCrmContactSchema = createInsertSchema(crmContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCrmContact = z.infer<typeof insertCrmContactSchema>;
export type CrmContact = typeof crmContacts.$inferSelect;

/** Deals pipeline */
export const crmDeals = pgTable("crm_deals", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  title: text("title").notNull(),
  value: integer("value").notNull(), // cents
  stage: text("stage").notNull().default("qualification"), // qualification, proposal, negotiation, won, lost
  expectedCloseAt: timestamp("expected_close_at"),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCrmDealSchema = createInsertSchema(crmDeals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCrmDeal = z.infer<typeof insertCrmDealSchema>;
export type CrmDeal = typeof crmDeals.$inferSelect;

/** Communication / activity log */
export const crmActivities = pgTable("crm_activities", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  dealId: integer("deal_id"),
  type: text("type").notNull(), // email, call, meeting, note
  subject: text("subject"),
  body: text("body"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCrmActivitySchema = createInsertSchema(crmActivities).omit({
  id: true,
  createdAt: true,
});
export type InsertCrmActivity = z.infer<typeof insertCrmActivitySchema>;
export type CrmActivity = typeof crmActivities.$inferSelect;

// ——— Lead Intelligence & Communication Tracking ———

/** Email engagement: open, click, reply, delivered */
export const communicationEvents = pgTable("communication_events", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(), // crm_contacts.id
  eventType: text("event_type").notNull(), // delivered | open | click | reply
  emailId: text("email_id"), // internal id for the email/campaign
  metadata: json("metadata").$type<{ url?: string; linkId?: string; subject?: string }>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceType: text("device_type"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CommunicationEvent = typeof communicationEvents.$inferSelect;
export type InsertCommunicationEvent = typeof communicationEvents.$inferInsert;

/** Document/proposal engagement: one row per document+lead, updated on each view/heartbeat */
export const documentEvents = pgTable("document_events", {
  id: serial("id").primaryKey(),
  documentId: text("document_id").notNull(), // e.g. quote id or tracking doc id
  documentType: text("document_type").notNull().default("proposal"), // proposal | strategy | quote | presentation | contract
  leadId: integer("lead_id"), // null if unknown visitor
  quoteId: integer("quote_id"), // client_quotes.id when document is a proposal
  viewCount: integer("view_count").notNull().default(1),
  firstViewedAt: timestamp("first_viewed_at").defaultNow().notNull(),
  lastViewedAt: timestamp("last_viewed_at").defaultNow().notNull(),
  totalViewTimeSeconds: integer("total_view_time_seconds").default(0),
  deviceType: text("device_type"),
  location: text("location"),
  lastEventDetail: text("last_event_detail"), // viewed | heartbeat | downloaded | shared_link
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DocumentEvent = typeof documentEvents.$inferSelect;
export type InsertDocumentEvent = typeof documentEvents.$inferInsert;

/** Per-view log for document engagement (timeline); document_events holds aggregated summary */
export const documentEventLog = pgTable("document_event_log", {
  id: serial("id").primaryKey(),
  documentEventId: integer("document_event_id"), // optional FK to document_events
  documentId: text("document_id").notNull(),
  documentType: text("document_type").notNull().default("proposal"),
  leadId: integer("lead_id"),
  quoteId: integer("quote_id"),
  eventDetail: text("event_detail").notNull(), // viewed | heartbeat | downloaded | shared_link
  viewTimeSeconds: integer("view_time_seconds"),
  deviceType: text("device_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DocumentEventLog = typeof documentEventLog.$inferSelect;
export type InsertDocumentEventLog = typeof documentEventLog.$inferInsert;

/** Anonymous then attributed visitor activity (pages, tools, forms, CTAs) */
export const visitorActivity = pgTable("visitor_activity", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(), // anonymous cookie/session id
  leadId: integer("lead_id"), // set when visitor converts to lead
  sessionId: text("session_id"),
  pageVisited: text("page_visited"),
  eventType: text("event_type").notNull(), // page_view | form_started | form_completed | cta_click | tool_used
  referrer: text("referrer"),
  deviceType: text("device_type"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VisitorActivity = typeof visitorActivity.$inferSelect;
export type InsertVisitorActivity = typeof visitorActivity.$inferInsert;

/** Real-time sales alerts for CRM dashboard and lead profile */
export const crmAlerts = pgTable("crm_alerts", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  alertType: text("alert_type").notNull(), // proposal_opened | site_revisit | pricing_click | proposal_multiple_views | high_engagement
  title: text("title").notNull(),
  message: text("message"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CrmAlert = typeof crmAlerts.$inferSelect;
export type InsertCrmAlert = typeof crmAlerts.$inferInsert;

// ——— Apollo-style: Tasks, Sequences, Saved Lists, Enrichment ———

/** Tasks / follow-ups linked to leads (call, email, research, proposal prep). */
export const crmTasks = pgTable("crm_tasks", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  type: text("type").notNull().default("follow_up"), // call | email | follow_up | research | proposal_prep
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").default("medium"), // low | medium | high | urgent
  dueAt: timestamp("due_at"),
  completedAt: timestamp("completed_at"),
  completedNotes: text("completed_notes"),
  ownerId: integer("owner_id"), // users.id when we have multi-user
  sequenceEnrollmentId: integer("sequence_enrollment_id"), // if created by a sequence step
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CrmTask = typeof crmTasks.$inferSelect;
export type InsertCrmTask = typeof crmTasks.$inferInsert;

/** Email / touchpoint sequences (multi-step campaigns). */
export const crmSequences = pgTable("crm_sequences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  steps: json("steps").$type<Array<{ type: "email" | "task"; waitDays: number; subject?: string; body?: string; taskType?: string; taskTitle?: string }>>().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CrmSequence = typeof crmSequences.$inferSelect;
export type InsertCrmSequence = typeof crmSequences.$inferInsert;

/** Enrollment of a contact in a sequence (tracks current step). */
export const crmSequenceEnrollments = pgTable("crm_sequence_enrollments", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  sequenceId: integer("sequence_id").notNull(),
  currentStepIndex: integer("current_step_index").notNull().default(0),
  status: text("status").notNull().default("active"), // active | completed | paused | stopped
  lastStepAt: timestamp("last_step_at"),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CrmSequenceEnrollment = typeof crmSequenceEnrollments.$inferSelect;
export type InsertCrmSequenceEnrollment = typeof crmSequenceEnrollments.$inferInsert;

/** Saved lists (smart filters) for quick access to segments. */
export const crmSavedLists = pgTable("crm_saved_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  filters: json("filters").$type<{
    type?: string;
    status?: string;
    intentLevel?: string;
    source?: string;
    noContactSinceDays?: number;
    hasOpenTasks?: boolean;
  }>().notNull(),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CrmSavedList = typeof crmSavedLists.$inferSelect;
export type InsertCrmSavedList = typeof crmSavedLists.$inferInsert;
