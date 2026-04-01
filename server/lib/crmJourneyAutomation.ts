/**
 * Event-driven contact lifecycle (crm_contacts.status): maps workflow triggers + journey metadata
 * to target statuses. Forward-only in the pipeline (never downgrades); respects terminal won/lost.
 */

import type { WorkflowPayload } from "@server/services/workflows/types";
import {
  CRM_LEAD_CONTACT_STATUS_ORDER,
  getNextLeadContactStatus,
  normalizeLeadContactStatus,
} from "@server/lib/crmContactLifecycleStatus";

function pipelineIndex(status: string): number {
  const n = normalizeLeadContactStatus(status);
  if (n === "won" || n === "lost") return -1;
  const i = CRM_LEAD_CONTACT_STATUS_ORDER.indexOf(n as (typeof CRM_LEAD_CONTACT_STATUS_ORDER)[number]);
  return i === -1 ? 0 : i;
}

/** Set status to at least `minimum` (e.g. deal reached proposal — contact should be ≥ proposal). */
export function atLeastPipelineStatus(
  currentRaw: string | null | undefined,
  minimum: (typeof CRM_LEAD_CONTACT_STATUS_ORDER)[number]
): string | null {
  const cur = normalizeLeadContactStatus(currentRaw);
  if (cur === "won" || cur === "lost") return null;
  const ci = pipelineIndex(cur);
  const mi = CRM_LEAD_CONTACT_STATUS_ORDER.indexOf(minimum);
  if (mi === -1 || ci === -1) return null;
  if (ci < mi) return minimum;
  return null;
}

/** True if `next` is same or forward along the pipeline vs `current` (non-terminal only). */
export function isSameOrForwardPipelineStatus(
  currentRaw: string | null | undefined,
  nextRaw: string | null | undefined
): boolean {
  const cur = normalizeLeadContactStatus(currentRaw);
  const next = normalizeLeadContactStatus(nextRaw);
  if (cur === "won" || cur === "lost") return false;
  if (next === "won" || next === "lost") return false;
  const ri = pipelineIndex(cur);
  const rn = pipelineIndex(next);
  if (ri === -1 || rn === -1) return false;
  return rn >= ri;
}

function enforceForwardOnly(
  currentRaw: string | null | undefined,
  candidate: string | null
): string | null {
  if (candidate == null) return null;
  const cur = normalizeLeadContactStatus(currentRaw);
  const next = normalizeLeadContactStatus(candidate);
  if (next === cur) return null;
  if (next !== "won" && next !== "lost") {
    const ri = pipelineIndex(cur);
    const rn = pipelineIndex(next);
    if (ri !== -1 && rn !== -1 && rn < ri) return null;
  }
  return next;
}

function emailStatusFromSource(
  cur: string,
  payload: WorkflowPayload
): string | null {
  const src = payload.journeyEvent?.emailSource ?? "other";
  const commName = (payload.journeyEvent?.commCampaignName ?? "").toLowerCase();
  const promoHint = /promo|offer|sale|announce|launch|newsletter/i.test(commName);

  switch (src) {
    case "newsletter": {
      if (cur === "new") return "contacted";
      if (cur === "contacted") return "qualified";
      return getNextLeadContactStatus(cur);
    }
    case "comm_campaign": {
      if (promoHint && (cur === "new" || cur === "contacted")) return "qualified";
      const bump = atLeastPipelineStatus(cur, "contacted");
      return bump ?? getNextLeadContactStatus(cur);
    }
    case "sequence": {
      const step = payload.journeyEvent?.sequenceStepIndex ?? 0;
      if (cur === "new") return "contacted";
      if (step >= 1 && (cur === "contacted" || cur === "new")) return "qualified";
      return getNextLeadContactStatus(cur);
    }
    default:
      if (cur === "new") return "contacted";
      return getNextLeadContactStatus(cur);
  }
}

function smsStatusFromVariant(cur: string, payload: WorkflowPayload): string | null {
  const v = payload.journeyEvent?.smsVariant ?? "other";
  switch (v) {
    case "welcome":
      if (cur === "new") return "contacted";
      return null;
    case "booking":
      return atLeastPipelineStatus(cur, "qualified") ?? (cur === "new" ? "contacted" : getNextLeadContactStatus(cur));
    case "missed_call":
      return atLeastPipelineStatus(cur, "contacted") ?? getNextLeadContactStatus(cur);
    case "manual":
      if (cur === "new") return "contacted";
      if (cur === "contacted") return "qualified";
      return getNextLeadContactStatus(cur);
    default:
      if (cur === "new") return "contacted";
      if (cur === "contacted") return "qualified";
      return getNextLeadContactStatus(cur);
  }
}

/**
 * Returns the next status for this trigger + optional journeyEvent, or null if no automated change.
 * Does not return won/lost here — those come from explicit deal-close workflows.
 */
export function resolveAutomatedContactStatusForTrigger(
  triggerType: string,
  currentRaw: string | null | undefined,
  payload: WorkflowPayload
): string | null {
  const cur = normalizeLeadContactStatus(currentRaw);
  if (cur === "won" || cur === "lost") return null;

  let candidate: string | null = null;

  switch (triggerType) {
    case "contact_email_sent":
      candidate = emailStatusFromSource(cur, payload);
      break;
    case "contact_sms_sent":
      candidate = smsStatusFromVariant(cur, payload);
      break;
    case "form_completed":
      if (cur === "new" || cur === "contacted") candidate = "qualified";
      else candidate = getNextLeadContactStatus(cur);
      break;
    case "calculator_completed":
      if (cur === "new" || cur === "contacted") candidate = "qualified";
      else if (cur === "qualified") candidate = "proposal";
      else candidate = getNextLeadContactStatus(cur);
      break;
    case "opportunity_marked_proposal_ready":
      candidate = atLeastPipelineStatus(cur, "proposal");
      break;
    case "ai_summary_generated":
      if (cur === "new") candidate = "contacted";
      break;
    case "recommendation_accepted":
      candidate = getNextLeadContactStatus(cur);
      break;
    default:
      return null;
  }

  return enforceForwardOnly(currentRaw, candidate);
}
