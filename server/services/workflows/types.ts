/**
 * Stage 4: Workflow automation types.
 */

import type { IStorage } from "@server/storage";
import type { CrmContact, CrmAccount, CrmDeal, CrmResearchProfile } from "@shared/crmSchema";

/** Channel + source for event-aware lifecycle automation (attached to workflow payload). */
export type JourneyChannel = "email" | "sms";
export type JourneyEmailSource = "newsletter" | "comm_campaign" | "sequence" | "other";
export type JourneySmsVariant = "manual" | "welcome" | "booking" | "missed_call" | "other";

export interface JourneyEventMetadata {
  channel: JourneyChannel;
  emailSource?: JourneyEmailSource;
  commCampaignName?: string;
  newsletterSubject?: string;
  sequenceName?: string;
  sequenceStepIndex?: number;
  smsVariant?: JourneySmsVariant;
}

/** Supported trigger types. */
export type WorkflowTriggerType =
  | "contact_created"
  | "account_created"
  | "lead_created"
  | "lead_updated"
  | "lead_stage_changed"
  | "lead_score_changed"
  | "task_overdue"
  | "task_completed"
  | "research_profile_updated"
  | "ai_summary_generated"
  | "recommendation_accepted"
  | "opportunity_marked_proposal_ready"
  | "opportunity_marked_won"
  | "opportunity_marked_lost"
  | "form_completed"
  | "audit_completed"
  | "calculator_completed"
  | "no_activity_detected"
  | "stale_lead_detected"
  | "stale_proposal_detected"
  | "missing_research_detected"
  | "missing_qualification_detected"
  /** Outbound email recorded for this contact (comm campaign, newsletter to CRM match, sequence email step). */
  | "contact_email_sent"
  /** Outbound SMS delivered to this contact (manual, welcome, booking link, revenue ops). */
  | "contact_sms_sent";

/** Supported action types. */
export type WorkflowActionType =
  | "create_task"
  | "update_lead_stage"
  | "update_status"
  | "update_tags"
  | "update_priority"
  | "update_nurture_state"
  | "update_outreach_state"
  | "assign_owner"
  | "mark_needs_research"
  | "mark_proposal_ready"
  | "mark_follow_up_required"
  | "log_activity"
  | "recalculate_score"
  | "recalculate_ai_priority"
  | "generate_ai_summary"
  | "generate_next_best_actions"
  | "generate_discovery_prep"
  | "generate_proposal_prep"
  | "notify_admin"
  | "notify_owner"
  | "create_internal_alert"
  | "mark_sequence_ready"
  | "set_do_not_contact"
  /** Sends a comm campaign that targets exactly this contact (segmentFilters.contactIds === [contactId], draft only). */
  | "send_comm_campaign";

export interface WorkflowPayload {
  contactId?: number;
  accountId?: number;
  dealId?: number;
  taskId?: number;
  contact?: CrmContact;
  account?: CrmAccount;
  deal?: CrmDeal;
  research?: CrmResearchProfile | null;
  previousStage?: string;
  newStage?: string;
  formSource?: string;
  /** Optional: what happened (email vs SMS, newsletter vs sequence, etc.) for journey automation. */
  journeyEvent?: JourneyEventMetadata;
  [key: string]: unknown;
}

export interface WorkflowContext {
  storage: IStorage;
  payload: WorkflowPayload;
  /** Trigger that fired this workflow run (for event-driven status rules). */
  triggerType?: WorkflowTriggerType | string;
}

export type ConditionFn = (ctx: WorkflowContext) => boolean | Promise<boolean>;
export type ActionFn = (ctx: WorkflowContext, params?: Record<string, unknown>) => Promise<{ ok: boolean; actionKey: string }>;

export interface WorkflowActionDef {
  type: WorkflowActionType;
  params?: Record<string, unknown>;
}

export interface WorkflowDefinition {
  key: string;
  name: string;
  trigger: WorkflowTriggerType;
  conditions?: ConditionFn[];
  actions: WorkflowActionDef[];
}

export interface WorkflowExecutionResult {
  workflowKey: string;
  triggerType: string;
  relatedEntityType: string;
  relatedEntityId: number;
  executedActions: string[];
  status: "success" | "partial" | "failed";
  startedAt: Date;
  finishedAt: Date;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}
