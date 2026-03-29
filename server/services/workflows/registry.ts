/**
 * Stage 4: Workflow definitions registry.
 */

import type { WorkflowDefinition } from "./types";
import { contactHasAccount, hasContact, noActivityForDays, alwaysTrue } from "./conditions";

export const WORKFLOW_NEW_QUALIFIED_LEAD: WorkflowDefinition = {
  key: "new_qualified_lead",
  name: "New qualified lead",
  trigger: "contact_created",
  conditions: [alwaysTrue()],
  actions: [
    { type: "update_tags", params: { add: ["new_lead"] } },
    { type: "update_outreach_state", params: { state: "ready_for_follow_up" } },
    { type: "create_task", params: { title: "Follow up with new lead", dueDays: 2, priority: "high" } },
    { type: "generate_ai_summary" },
    { type: "create_internal_alert", params: { alertType: "high_engagement", title: "New lead added", message: "New lead created; follow up suggested." } },
  ],
};

export const WORKFLOW_FORM_COMPLETED: WorkflowDefinition = {
  key: "form_completed",
  name: "Form completed",
  trigger: "form_completed",
  conditions: [alwaysTrue()],
  actions: [
    { type: "update_tags", params: { add: ["form_submit"] } },
    { type: "update_status", params: { useJourneyRules: true } },
    { type: "create_task", params: { title: "Follow up after form submission", dueDays: 1, priority: "high" } },
    { type: "generate_ai_summary" },
  ],
};

export const WORKFLOW_CALCULATOR_COMPLETED: WorkflowDefinition = {
  key: "calculator_completed",
  name: "Calculator completed",
  trigger: "calculator_completed",
  conditions: [alwaysTrue()],
  actions: [
    { type: "update_tags", params: { add: ["offer_valuation"] } },
    { type: "update_status", params: { useJourneyRules: true } },
    {
      type: "create_task",
      params: {
        title: "Follow up on offer valuation lead",
        dueDays: 1,
        priority: "high",
      },
    },
    {
      type: "create_internal_alert",
      params: {
        alertType: "high_engagement",
        title: "New offer valuation lead",
        message: "A lead completed the Offer Valuation Engine.",
      },
    },
  ],
};

export const WORKFLOW_PROPOSAL_READY: WorkflowDefinition = {
  key: "proposal_ready",
  name: "Proposal ready",
  trigger: "opportunity_marked_proposal_ready",
  conditions: [alwaysTrue()],
  actions: [
    { type: "update_status", params: { useJourneyRules: true } },
    { type: "generate_proposal_prep" },
    { type: "create_task", params: { title: "Prepare proposal / checklist", dueDays: 3, priority: "high" } },
    { type: "log_activity", params: { title: "Moved to proposal ready", content: "Workflow: proposal prep and task created." } },
  ],
};

export const WORKFLOW_STALE_LEAD: WorkflowDefinition = {
  key: "stale_lead",
  name: "Stale lead",
  trigger: "stale_lead_detected",
  conditions: [noActivityForDays(14)],
  actions: [
    { type: "mark_follow_up_required", params: { days: 1 } },
    { type: "create_task", params: { title: "Re-engage stale lead", dueDays: 1, priority: "medium" } },
    { type: "log_activity", params: { title: "Stale lead workflow", content: "No activity detected; follow-up task created." } },
  ],
};

export const WORKFLOW_MISSING_QUALIFICATION: WorkflowDefinition = {
  key: "missing_qualification",
  name: "Missing qualification",
  trigger: "missing_qualification_detected",
  conditions: [alwaysTrue()],
  actions: [
    { type: "generate_ai_summary" },
    { type: "create_task", params: { title: "Capture missing qualification (budget, timeline, pain point)", dueDays: 2, priority: "high" } },
    { type: "create_internal_alert", params: { alertType: "high_engagement", title: "Missing qualification", message: "Lead needs qualification data." } },
  ],
};

export const WORKFLOW_MISSING_RESEARCH: WorkflowDefinition = {
  key: "missing_research",
  name: "Missing research",
  trigger: "missing_research_detected",
  conditions: [contactHasAccount],
  actions: [
    { type: "mark_needs_research" },
    { type: "create_task", params: { title: "Research account / website", dueDays: 3, priority: "medium" } },
  ],
};

export const WORKFLOW_OPPORTUNITY_WON: WorkflowDefinition = {
  key: "opportunity_won",
  name: "Opportunity won",
  trigger: "opportunity_marked_won",
  conditions: [alwaysTrue()],
  actions: [
    { type: "update_status", params: { status: "won" } },
    { type: "log_activity", params: { title: "Deal won", content: "Opportunity marked won; contact status set to won." } },
    { type: "update_outreach_state", params: { state: "not_started" } },
  ],
};

export const WORKFLOW_OPPORTUNITY_LOST: WorkflowDefinition = {
  key: "opportunity_lost",
  name: "Opportunity lost",
  trigger: "opportunity_marked_lost",
  conditions: [alwaysTrue()],
  actions: [
    { type: "update_status", params: { status: "lost" } },
    { type: "log_activity", params: { title: "Deal lost", content: "Opportunity marked lost; contact status set to lost." } },
    { type: "update_nurture_state", params: { state: "follow_up_later", reason: "Lost; nurture later" } },
  ],
};

/** When an outbound email is sent to a CRM contact, adjust lifecycle from event type (newsletter, campaign, sequence, …). */
export const WORKFLOW_CONTACT_EMAIL_SENT: WorkflowDefinition = {
  key: "contact_email_sent_journey",
  name: "After email to contact — journey status",
  trigger: "contact_email_sent",
  conditions: [alwaysTrue()],
  actions: [
    { type: "update_status", params: { useJourneyRules: true } },
    {
      type: "log_activity",
      params: {
        title: "Outbound email",
        content: "Automation: lifecycle status updated from outbound email context (newsletter, campaign, sequence, etc.).",
      },
    },
  ],
};

/** When an outbound SMS is sent to a CRM contact, adjust lifecycle from SMS type (welcome, booking, manual, …). */
export const WORKFLOW_CONTACT_SMS_SENT: WorkflowDefinition = {
  key: "contact_sms_sent_journey",
  name: "After SMS to contact — journey status",
  trigger: "contact_sms_sent",
  conditions: [alwaysTrue()],
  actions: [
    { type: "update_status", params: { useJourneyRules: true } },
    {
      type: "log_activity",
      params: {
        title: "Outbound SMS",
        content: "Automation: lifecycle status updated from SMS context (welcome, booking link, manual, etc.).",
      },
    },
  ],
};

export const WORKFLOW_AI_SUMMARY_GENERATED: WorkflowDefinition = {
  key: "after_ai_summary",
  name: "After AI summary",
  trigger: "ai_summary_generated",
  conditions: [alwaysTrue()],
  actions: [
    { type: "update_status", params: { useJourneyRules: true } },
    { type: "log_activity", params: { title: "AI guidance generated", content: "Workflow recorded." } },
  ],
};

export const WORKFLOW_RECOMMENDATION_ACCEPTED: WorkflowDefinition = {
  key: "after_recommendation_accepted",
  name: "After recommendation accepted",
  trigger: "recommendation_accepted",
  conditions: [alwaysTrue()],
  actions: [
    { type: "update_status", params: { useJourneyRules: true } },
    { type: "log_activity", params: { title: "AI recommendation accepted", content: "Task created from recommendation." } },
  ],
};

/** Scheduler: always rows an activity note (contact optional). */
export const WORKFLOW_APPOINTMENT_BOOKED_AUDIT: WorkflowDefinition = {
  key: "appointment_booked_audit",
  name: "Meeting booked — activity log",
  trigger: "appointment_booked",
  conditions: [alwaysTrue()],
  actions: [
    {
      type: "log_activity",
      params: {
        title: "Meeting booked (scheduler)",
        content:
          "Someone booked a meeting via the public scheduler. Open Meetings & calendar for time and details.",
        metadata: { scheduler: true },
      },
    },
  ],
};

export const WORKFLOW_APPOINTMENT_BOOKED_CRM: WorkflowDefinition = {
  key: "appointment_booked_crm",
  name: "Meeting booked — CRM prep",
  trigger: "appointment_booked",
  conditions: [hasContact],
  actions: [
    { type: "update_tags", params: { add: ["meeting_booked"] } },
    {
      type: "create_task",
      params: { title: "Prep for scheduled meeting", dueDays: 1, priority: "high" },
    },
    {
      type: "log_activity",
      params: {
        title: "Booking linked to contact",
        content: "Scheduler automation: tagged meeting_booked and added a prep task.",
        metadata: { scheduler: true },
      },
    },
  ],
};

export const WORKFLOW_APPOINTMENT_CANCELLED_AUDIT: WorkflowDefinition = {
  key: "appointment_cancelled_audit",
  name: "Meeting cancelled — activity log",
  trigger: "appointment_cancelled",
  conditions: [alwaysTrue()],
  actions: [
    {
      type: "log_activity",
      params: {
        title: "Meeting cancelled (scheduler)",
        content: "A scheduled meeting was cancelled.",
        metadata: { scheduler: true },
      },
    },
  ],
};

export const WORKFLOW_APPOINTMENT_CANCELLED_CRM: WorkflowDefinition = {
  key: "appointment_cancelled_crm",
  name: "Meeting cancelled — CRM alert",
  trigger: "appointment_cancelled",
  conditions: [hasContact],
  actions: [
    {
      type: "update_tags",
      params: { add: ["meeting_cancelled"] },
    },
    {
      type: "create_internal_alert",
      params: {
        alertType: "high_engagement",
        title: "Meeting cancelled",
        message: "A booking was cancelled; consider re-engaging if appropriate.",
      },
    },
  ],
};

export const WORKFLOW_APPOINTMENT_COMPLETED_AUDIT: WorkflowDefinition = {
  key: "appointment_completed_audit",
  name: "Meeting completed — activity log",
  trigger: "appointment_completed",
  conditions: [alwaysTrue()],
  actions: [
    {
      type: "log_activity",
      params: {
        title: "Meeting completed (scheduler)",
        content: "A meeting was marked completed.",
        metadata: { scheduler: true },
      },
    },
  ],
};

export const WORKFLOW_APPOINTMENT_COMPLETED_CRM: WorkflowDefinition = {
  key: "appointment_completed_crm",
  name: "Meeting completed — CRM tag",
  trigger: "appointment_completed",
  conditions: [hasContact],
  actions: [
    { type: "update_tags", params: { add: ["meeting_completed"] } },
    {
      type: "log_activity",
      params: {
        title: "Meeting completed",
        content: "Scheduler automation: tagged meeting_completed.",
        metadata: { scheduler: true },
      },
    },
  ],
};

export const WORKFLOW_APPOINTMENT_NO_SHOW_AUDIT: WorkflowDefinition = {
  key: "appointment_no_show_audit",
  name: "No-show — activity log",
  trigger: "appointment_no_show",
  conditions: [alwaysTrue()],
  actions: [
    {
      type: "log_activity",
      params: {
        title: "No-show (scheduler)",
        content: "A meeting was marked no-show.",
        metadata: { scheduler: true },
      },
    },
  ],
};

export const WORKFLOW_APPOINTMENT_NO_SHOW_CRM: WorkflowDefinition = {
  key: "appointment_no_show_crm",
  name: "No-show — follow-up",
  trigger: "appointment_no_show",
  conditions: [hasContact],
  actions: [
    { type: "mark_follow_up_required", params: { days: 1 } },
    {
      type: "create_internal_alert",
      params: {
        alertType: "high_engagement",
        title: "Meeting no-show",
        message: "Follow up with the guest and reschedule if appropriate.",
      },
    },
    {
      type: "log_activity",
      params: {
        title: "No-show follow-up",
        content: "Scheduler automation: marked follow-up due and created an alert.",
        metadata: { scheduler: true },
      },
    },
  ],
};

const ALL_WORKFLOWS: WorkflowDefinition[] = [
  WORKFLOW_NEW_QUALIFIED_LEAD,
  WORKFLOW_FORM_COMPLETED,
  WORKFLOW_CALCULATOR_COMPLETED,
  WORKFLOW_PROPOSAL_READY,
  WORKFLOW_STALE_LEAD,
  WORKFLOW_MISSING_QUALIFICATION,
  WORKFLOW_MISSING_RESEARCH,
  WORKFLOW_OPPORTUNITY_WON,
  WORKFLOW_OPPORTUNITY_LOST,
  WORKFLOW_CONTACT_EMAIL_SENT,
  WORKFLOW_CONTACT_SMS_SENT,
  WORKFLOW_AI_SUMMARY_GENERATED,
  WORKFLOW_RECOMMENDATION_ACCEPTED,
  WORKFLOW_APPOINTMENT_BOOKED_AUDIT,
  WORKFLOW_APPOINTMENT_BOOKED_CRM,
  WORKFLOW_APPOINTMENT_CANCELLED_AUDIT,
  WORKFLOW_APPOINTMENT_CANCELLED_CRM,
  WORKFLOW_APPOINTMENT_COMPLETED_AUDIT,
  WORKFLOW_APPOINTMENT_COMPLETED_CRM,
  WORKFLOW_APPOINTMENT_NO_SHOW_AUDIT,
  WORKFLOW_APPOINTMENT_NO_SHOW_CRM,
];

export function getWorkflowsByTrigger(trigger: string): WorkflowDefinition[] {
  return ALL_WORKFLOWS.filter((w) => w.trigger === trigger);
}

export function getAllWorkflows(): WorkflowDefinition[] {
  return ALL_WORKFLOWS;
}
