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

// ——— Accounts / Companies (Stage 1 CRM foundation) ———

export const crmAccounts = pgTable("crm_accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  website: text("website"),
  domain: text("domain"),
  industry: text("industry"),
  businessType: text("business_type"),
  companySize: text("company_size"),
  estimatedRevenueRange: text("estimated_revenue_range"),
  location: text("location"),
  serviceArea: text("service_area"),
  currentWebsiteStatus: text("current_website_status"),
  currentMarketingMaturity: text("current_marketing_maturity"),
  growthPainPoints: text("growth_pain_points"),
  leadSource: text("lead_source"),
  accountStatus: text("account_status").default("active"), // active | inactive | prospect
  tags: json("tags").$type<string[]>(),
  notesSummary: text("notes_summary"),
  ownerUserId: integer("owner_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCrmAccountSchema = createInsertSchema(crmAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCrmAccount = z.infer<typeof insertCrmAccountSchema>;
export type CrmAccount = typeof crmAccounts.$inferSelect;

// ——— Contacts ———

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
  accountId: integer("account_id"), // FK to crm_accounts
  firstName: text("first_name"),
  lastName: text("last_name"),
  notesSummary: text("notes_summary"),
  ownerUserId: integer("owner_user_id"),
  lastContactedAt: timestamp("last_contacted_at"),
  nextActionAt: timestamp("next_action_at"),
  aiFitScore: integer("ai_fit_score"), // 0–100, ideal client fit
  /** Lead qualifying / demographics (for acquisition analytics) */
  ageRange: text("age_range"),
  gender: text("gender"),
  companySize: text("company_size"),
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
  // Lifecycle and attribution (lead intelligence)
  lifecycleStage: text("lifecycle_stage"), // cold | warm | qualified | sales_ready
  lastActivityAt: timestamp("last_activity_at"),
  bookedCallAt: timestamp("booked_call_at"),
  websiteUrl: text("website_url"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  referringPage: text("referring_page"),
  landingPage: text("landing_page"),
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

/** Deals / Leads / Opportunities pipeline */
export const crmDeals = pgTable("crm_deals", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  accountId: integer("account_id"),
  title: text("title").notNull(),
  value: integer("value").notNull(), // cents (estimatedValue)
  stage: text("stage").notNull().default("qualification"), // legacy
  pipelineStage: text("pipeline_stage").default("new_lead"), // new_lead | researching | qualified | proposal_ready | follow_up | negotiation | won | lost | nurture
  serviceInterest: text("service_interest"),
  primaryPainPoint: text("primary_pain_point"),
  businessGoal: text("business_goal"),
  urgencyLevel: text("urgency_level"),
  budgetRange: text("budget_range"),
  confidenceLevel: text("confidence_level"),
  lifecycleStage: text("lifecycle_stage"),
  leadScore: integer("lead_score"),
  aiPriorityScore: integer("ai_priority_score"),
  estimatedCloseProbability: integer("estimated_close_probability"), // 0–100
  expectedCloseAt: timestamp("expected_close_at"),
  closedAt: timestamp("closed_at"),
  source: text("source"),
  campaign: text("campaign"),
  medium: text("medium"),
  referringPage: text("referring_page"),
  landingPage: text("landing_page"),
  notes: text("notes"),
  notesSummary: text("notes_summary"),
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

/** Communication / activity log (contact-centric; legacy) */
export const crmActivities = pgTable("crm_activities", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  dealId: integer("deal_id"),
  type: text("type").notNull(), // email, call, meeting, note
  subject: text("subject"),
  body: text("body"),
  /** For type=meeting: { meetingUrl?: string; startUrl?: string; meetingId?: string; scheduledAt?: string } */
  metadata: json("metadata").$type<{ meetingUrl?: string; startUrl?: string; meetingId?: string; scheduledAt?: string }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Unified activity log for all CRM entities (Stage 1). */
export const crmActivityLog = pgTable("crm_activity_log", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id"),
  accountId: integer("account_id"),
  dealId: integer("deal_id"),
  taskId: integer("task_id"),
  type: text("type").notNull(), // note | form_submission | status_change | stage_change | task_created | task_completed | research_updated | score_recalculated
  title: text("title").notNull(),
  content: text("content"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CrmActivityLog = typeof crmActivityLog.$inferSelect;
export type InsertCrmActivityLog = typeof crmActivityLog.$inferInsert;

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
  /** Geo/demographics from request (Vercel/Cloudflare headers or IP lookup) */
  country: text("country"),
  region: text("region"),
  city: text("city"),
  timezone: text("timezone"),
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

/** Lead score change history for analytics and auditing. */
export const leadScoreEvents = pgTable("lead_score_events", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  previousScore: integer("previous_score"),
  newScore: integer("new_score").notNull(),
  pointsDelta: integer("points_delta").notNull(),
  reason: text("reason").notNull(), // e.g. "pricing_page_view" | "form_completed"
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LeadScoreEvent = typeof leadScoreEvents.$inferSelect;
export type InsertLeadScoreEvent = typeof leadScoreEvents.$inferInsert;

// ——— Apollo-style: Tasks, Sequences, Saved Lists, Enrichment ———

/** Tasks / follow-ups linked to contacts, deals, or accounts. */
export const crmTasks = pgTable("crm_tasks", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  relatedDealId: integer("related_deal_id"),
  relatedAccountId: integer("related_account_id"),
  assignedToUserId: integer("assigned_to_user_id"),
  type: text("type").notNull().default("follow_up"), // call | email | follow_up | research | proposal_prep
  taskType: text("task_type"), // alias for type; keep type for compat
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").default("medium"), // low | medium | high | urgent
  dueAt: timestamp("due_at"),
  status: text("status").default("pending"), // pending | in_progress | completed | cancelled
  completedAt: timestamp("completed_at"),
  completedNotes: text("completed_notes"),
  aiSuggested: boolean("ai_suggested").default(false),
  ownerId: integer("owner_id"),
  sequenceEnrollmentId: integer("sequence_enrollment_id"),
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
  /** When to run: "now" = start as soon as contacts are enrolled; "scheduled" = first step at scheduledStartAt */
  triggerType: text("trigger_type").$type<"now" | "scheduled">().default("now"),
  scheduledStartAt: timestamp("scheduled_start_at"),
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
    pipelineStage?: string;
    lifecycleStage?: string;
    tags?: string[];
    hasResearch?: boolean;
  }>().notNull(),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CrmSavedList = typeof crmSavedLists.$inferSelect;
export type InsertCrmSavedList = typeof crmSavedLists.$inferInsert;

// ——— Research profiles (Stage 1) ———

export const crmResearchProfiles = pgTable("crm_research_profiles", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  contactId: integer("contact_id"),
  companySummary: text("company_summary"),
  websiteFindings: text("website_findings"),
  designUxNotes: text("design_ux_notes"),
  messagingNotes: text("messaging_notes"),
  conversionNotes: text("conversion_notes"),
  seoVisibilityNotes: text("seo_visibility_notes"),
  automationOpportunityNotes: text("automation_opportunity_notes"),
  technicalIssuesNotes: text("technical_issues_notes"),
  likelyPainPoints: text("likely_pain_points"),
  suggestedServiceFit: text("suggested_service_fit"),
  suggestedOutreachAngle: text("suggested_outreach_angle"),
  aiGeneratedSummary: text("ai_generated_summary"),
  researchConfidence: text("research_confidence"), // low | medium | high
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CrmResearchProfile = typeof crmResearchProfiles.$inferSelect;
export type InsertCrmResearchProfile = typeof crmResearchProfiles.$inferInsert;
