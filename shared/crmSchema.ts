import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  json,
  integer,
  real,
  unique,
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
  /** Self-reported role category from forms (distinct from job title / LinkedIn title) */
  occupation: text("occupation"),
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
  // Stage 4: outreach / nurture / sequence-ready
  outreachState: text("outreach_state"), // not_started | research_first | ready_for_follow_up | waiting_for_response | follow_up_due | nurture_only | do_not_contact
  nurtureState: text("nurture_state"), // new_nurture | educational | case_study_ready | follow_up_later | dormant | reactivation_candidate
  sequenceReady: boolean("sequence_ready").default(false),
  lastOutreachAt: timestamp("last_outreach_at"),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  doNotContact: boolean("do_not_contact").default(false),
  nurtureReason: text("nurture_reason"),
  lostReason: text("lost_reason"),
  responseStatus: text("response_status"), // e.g. awaiting_reply | replied | no_response
  reactivationEligible: boolean("reactivation_eligible").default(false),
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
  lostReason: text("lost_reason"), // Stage 4: when pipelineStage = lost
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
  /** Open/click/delivered context; Ascendra Communications adds commCampaign* / commSendId. */
  metadata: json("metadata").$type<Record<string, unknown>>(),
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

// ——— AI Guidance (Stage 3): persisted summaries, recommendations, discovery/proposal prep ———

export const crmAiGuidance = pgTable("crm_ai_guidance", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // contact | account | deal
  entityId: integer("entity_id").notNull(),
  outputType: text("output_type").notNull(), // lead_summary | account_summary | contact_summary | opportunity_assessment | research_summary | next_best_actions | discovery_questions | proposal_prep | risk_warnings | qualification_gaps | follow_up_angle
  content: json("content").$type<Record<string, unknown>>().notNull(),
  providerType: text("provider_type").notNull().default("rule"), // rule | llm
  version: integer("version").notNull().default(1),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  generatedBySystem: boolean("generated_by_system").default(true),
  staleAt: timestamp("stale_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CrmAiGuidance = typeof crmAiGuidance.$inferSelect;
export type InsertCrmAiGuidance = typeof crmAiGuidance.$inferInsert;

// ——— Workflow automation (Stage 4): execution log ———

export const crmWorkflowExecutions = pgTable("crm_workflow_executions", {
  id: serial("id").primaryKey(),
  workflowKey: text("workflow_key").notNull(),
  triggerType: text("trigger_type").notNull(),
  relatedEntityType: text("related_entity_type").notNull(), // contact | account | deal
  relatedEntityId: integer("related_entity_id").notNull(),
  executedActions: json("executed_actions").$type<string[]>().default([]),
  status: text("status").notNull().default("success"), // success | partial | failed
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
  errorMessage: text("error_message"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CrmWorkflowExecution = typeof crmWorkflowExecutions.$inferSelect;
export type InsertCrmWorkflowExecution = typeof crmWorkflowExecutions.$inferInsert;

// ——— Stage 3.5: Discovery workspace, proposal prep, sales playbook ———

/** Discovery call workspace: linked to lead/opportunity for structured prep and notes. */
export const crmDiscoveryWorkspaces = pgTable("crm_discovery_workspaces", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  dealId: integer("deal_id"),
  accountId: integer("account_id"),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"), // draft | scheduled | completed | cancelled
  callDate: timestamp("call_date"),
  meetingType: text("meeting_type"), // discovery | follow_up | kickoff
  attendedBy: text("attended_by"),
  preparednessScore: integer("preparedness_score"), // 0-100
  fitAssessment: text("fit_assessment"), // low_fit | unclear_fit | promising | high_fit | nurture
  readinessAssessment: text("readiness_assessment"), // missing_key_data | early | qualified | proposal_ready
  summary: text("summary"),
  riskSummary: text("risk_summary"),
  recommendedOfferDirection: text("recommended_offer_direction"),
  nextStepRecommendation: text("next_step_recommendation"),
  createdByUserId: integer("created_by_user_id"),
  /** Structured notes: business overview, pain points, goals, budget, timeline, objections, etc. */
  notesSections: json("notes_sections").$type<Record<string, string>>(),
  /** Discovery outcome: nurture recommendation, disqualify reason, follow-up items */
  outcome: json("outcome").$type<{ fitVerdict?: string; urgencyVerdict?: string; budgetConfidence?: string; proposalReadiness?: string; nurtureRecommendation?: string; disqualifyReason?: string; followUpItems?: string[] }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CrmDiscoveryWorkspace = typeof crmDiscoveryWorkspaces.$inferSelect;
export type InsertCrmDiscoveryWorkspace = typeof crmDiscoveryWorkspaces.$inferInsert;

/** Saved inputs for the proposal prep profitability calculator (computed metrics derived client-side). */
export type ProposalPrepProfitabilityInputs = {
  quotedPrice?: number | null;
  internalHours?: number | null;
  /** Blended internal cost per hour (loaded cost). */
  hourlyCost?: number | null;
  passThroughCosts?: number | null;
  /** Percent of quoted price paid to commission (0–100). */
  salesCommissionPct?: number | null;
  /** Target gross margin for “suggested price” helper (0–100). */
  targetGrossMarginPct?: number | null;
};

/** Web sources attached to the latest market intel run (Brave snippets). */
export type ProposalPrepMarketIntelSource = {
  title: string;
  url: string;
  snippet: string;
};

export type ProposalPrepMarketIntelMeta = {
  generatedAt: string;
  queriesUsed: string[];
  model?: string;
  braveConfigured: boolean;
  /** When true, synthesis had no web results — copy is exploratory only. */
  noLiveSources?: boolean;
};

/** Proposal prep workspace: internal prep before writing proposal. */
export const crmProposalPrepWorkspaces = pgTable("crm_proposal_prep_workspaces", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  dealId: integer("deal_id"),
  accountId: integer("account_id"),
  discoveryWorkspaceId: integer("discovery_workspace_id"),
  status: text("status").notNull().default("draft"), // draft | needs_clarification | internal_review | ready_to_write
  offerDirection: text("offer_direction"),
  scopeSummary: text("scope_summary"),
  deliverablesDraft: text("deliverables_draft"),
  assumptions: text("assumptions"),
  exclusions: text("exclusions"),
  pricingNotes: text("pricing_notes"),
  timelineNotes: text("timeline_notes"),
  risks: text("risks"),
  dependencies: text("dependencies"),
  crossSellOpportunities: text("cross_sell_opportunities"),
  decisionFactors: text("decision_factors"),
  proposalReadinessScore: integer("proposal_readiness_score"), // 0-100
  aiSummary: text("ai_summary"),
  createdByUserId: integer("created_by_user_id"),
  /** Linked sales playbook for reference */
  playbookId: integer("playbook_id"),
  /** Checklist: items like budget confirmed, timeline discussed, etc. */
  checklist: json("checklist").$type<Array<{ id: string; label: string; done: boolean }>>(),
  /** Advanced sales tools — calculator inputs (outputs computed in UI). */
  profitabilityInputsJson: json("profitability_inputs_json").$type<ProposalPrepProfitabilityInputs | null>(),
  /** AI + web-grounded market / pricing snapshot (markdown). */
  marketIntelSummary: text("market_intel_summary"),
  marketIntelSourcesJson: json("market_intel_sources_json").$type<ProposalPrepMarketIntelSource[] | null>(),
  marketIntelMetaJson: json("market_intel_meta_json").$type<ProposalPrepMarketIntelMeta | null>(),
  marketIntelUpdatedAt: timestamp("market_intel_updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CrmProposalPrepWorkspace = typeof crmProposalPrepWorkspaces.$inferSelect;
export type InsertCrmProposalPrepWorkspace = typeof crmProposalPrepWorkspaces.$inferInsert;

/** Sales playbook: reusable internal guidance per service/category. */
export const crmSalesPlaybooks = pgTable("crm_sales_playbooks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  category: text("category"), // qualification | discovery | proposal | follow_up
  serviceType: text("service_type"), // web_design | funnel_optimization | branding | etc.
  description: text("description"),
  checklistItems: json("checklist_items").$type<string[]>(),
  qualificationRules: text("qualification_rules"),
  redFlags: text("red_flags"),
  proposalRequirements: text("proposal_requirements"),
  followUpGuidance: text("follow_up_guidance"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CrmSalesPlaybook = typeof crmSalesPlaybooks.$inferSelect;
export type InsertCrmSalesPlaybook = typeof crmSalesPlaybooks.$inferInsert;

// ——— Social profile discovery (web search → suggested links; admin confirms) ———

export const crmContactSocialSuggestions = pgTable("crm_contact_social_suggestions", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id")
    .notNull()
    .references(() => crmContacts.id, { onDelete: "cascade" }),
  /** linkedin | x | facebook | instagram | github | other */
  platform: text("platform").notNull(),
  profileUrl: text("profile_url").notNull(),
  displayName: text("display_name"),
  snippet: text("snippet"),
  /** 0–100 heuristic or model-assisted */
  confidence: integer("confidence"),
  matchReason: text("match_reason"),
  /** brave_web | openai_ranked | search_link_only */
  discoverySource: text("discovery_source").notNull(),
  /** suggested | applied | dismissed | superseded */
  status: text("status").notNull().default("suggested"),
  discoveryRunId: text("discovery_run_id").notNull(),
  rawMetadata: json("raw_metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CrmContactSocialSuggestion = typeof crmContactSocialSuggestions.$inferSelect;
export type InsertCrmContactSocialSuggestion = typeof crmContactSocialSuggestions.$inferInsert;

/** Singleton row (id=1): internal Revenue Ops templates, toggles, default booking URL. */
export type RevenueOpsSettingsConfig = {
  welcomeSmsEnabled?: boolean;
  welcomeSmsTemplate?: string;
  missedCallSmsEnabled?: boolean;
  missedCallSmsTemplate?: string;
  defaultBookingUrl?: string;
};

export const revenueOpsSettings = pgTable("revenue_ops_settings", {
  id: integer("id").primaryKey().default(1),
  config: json("config").$type<RevenueOpsSettingsConfig>().notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type RevenueOpsSettingsRow = typeof revenueOpsSettings.$inferSelect;
export type InsertRevenueOpsSettingsRow = typeof revenueOpsSettings.$inferInsert;

// ——— Growth Intelligence: experiments and variant assignment ———

/** A/B or multivariate experiments (e.g. hero CTA, offer headline). */
export const growthExperiments = pgTable("growth_experiments", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g. homepage_hero_cta
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"), // draft | running | paused | ended
  startAt: timestamp("start_at"),
  endAt: timestamp("end_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GrowthExperiment = typeof growthExperiments.$inferSelect;
export type InsertGrowthExperiment = typeof growthExperiments.$inferInsert;

/** Variants for an experiment (e.g. control, variant_a). */
export const growthVariants = pgTable("growth_variants", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id").notNull().references(() => growthExperiments.id, { onDelete: "cascade" }),
  key: text("key").notNull(), // e.g. control | variant_a
  name: text("name").notNull(),
  config: json("config").$type<Record<string, unknown>>(), // e.g. { label: "Get audit", href: "/audit" }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GrowthVariant = typeof growthVariants.$inferSelect;
export type InsertGrowthVariant = typeof growthVariants.$inferInsert;

/** Sticky assignment: visitor/session -> variant (so same user sees same variant). */
export const growthAssignments = pgTable(
  "growth_assignments",
  {
    id: serial("id").primaryKey(),
    experimentId: integer("experiment_id").notNull().references(() => growthExperiments.id, { onDelete: "cascade" }),
    variantId: integer("variant_id").notNull().references(() => growthVariants.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    sessionId: text("session_id"),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  },
  (t) => [unique("growth_assignments_experiment_visitor").on(t.experimentId, t.visitorId)]
);

export type GrowthAssignment = typeof growthAssignments.$inferSelect;
export type InsertGrowthAssignment = typeof growthAssignments.$inferInsert;
