/**
 * Stage 1 CRM foundation: rule-based scoring, next best actions, activity logging.
 * Extensible for future AI/LLM integration.
 */

import type { CrmContact } from "@shared/crmSchema";
import type { CrmAccount } from "@shared/crmSchema";
import type { CrmDeal } from "@shared/crmSchema";
import type { CrmResearchProfile } from "@shared/crmSchema";
import type { IStorage } from "@server/storage";

/** Source quality tier for fit/priority: higher = better lead source. */
const SOURCE_QUALITY: Record<string, number> = {
  referral: 25,
  linkedin: 20,
  website: 15,
  google: 15,
  organic: 12,
  paid: 10,
  unknown: 0,
};

function getSourceQualityScore(source: string | null | undefined): number {
  if (!source) return 0;
  const key = source.toLowerCase().replace(/\s+/g, "_");
  for (const [k, v] of Object.entries(SOURCE_QUALITY)) {
    if (key.includes(k)) return v;
  }
  return 5;
}

/** 0–100 score from contact/account fit signals (industry, size, source quality, completeness). */
export function calculateAiFitScore(contact: CrmContact, account?: CrmAccount | null): number {
  let score = 0;
  if (contact.industry) score += 12;
  if (contact.company || account?.name) score += 12;
  if (contact.jobTitle) score += 10;
  if (contact.leadScore != null && contact.leadScore > 0) score += Math.min(25, contact.leadScore / 4);
  score += getSourceQualityScore(contact.source ?? contact.utmSource ?? undefined);
  if (account?.industry) score += 8;
  if (account?.companySize) score += 5;
  if (account?.currentWebsiteStatus) score += 5;
  if (contact.linkedinUrl) score += 5;
  if (contact.websiteUrl) score += 3;
  if (contact.phone) score += 2;
  return Math.min(100, score);
}

/** 0–100 priority from lead/deal signals (urgency, value, stage, research, completeness, source). */
export function calculateAiPriorityScore(deal: CrmDeal, hasResearch?: boolean): number {
  let score = 0;
  const urgency = (deal.urgencyLevel ?? "").toLowerCase();
  if (urgency.includes("high") || urgency.includes("asap")) score += 22;
  else if (urgency.includes("medium")) score += 14;
  else if (urgency) score += 5;
  const value = deal.value ?? 0;
  if (value > 100000) score += 18;
  else if (value > 50000) score += 14;
  else if (value > 10000) score += 8;
  const stage = deal.pipelineStage ?? deal.stage ?? "";
  if (["negotiation", "proposal_ready"].includes(stage)) score += 18;
  else if (stage === "qualified") score += 14;
  else if (["follow_up", "researching"].includes(stage)) score += 8;
  if (deal.leadScore != null) score += Math.min(18, deal.leadScore / 5);
  if (deal.primaryPainPoint) score += 4;
  if (deal.budgetRange) score += 4;
  if (deal.expectedCloseAt) score += 5;
  if (hasResearch) score += 6;
  score += getSourceQualityScore(deal.source ?? undefined);
  return Math.min(100, score);
}

export interface NextBestAction {
  action: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

/** Smarter next-best-action: prioritizes missing data, research, then stage-based actions. */
export function generateNextBestActions(
  deal: CrmDeal,
  opts?: { hasResearch?: boolean; contactHasAccount?: boolean }
): NextBestAction[] {
  const actions: NextBestAction[] = [];
  const hasResearch = opts?.hasResearch ?? false;
  const stage = deal.pipelineStage ?? deal.stage ?? "";

  const add = (action: string, reason: string, priority: NextBestAction["priority"]) => {
    actions.push({ action, reason, priority });
  };

  if (!deal.accountId && !opts?.contactHasAccount) {
    add("Add account / company", "Link lead to an account for research and context", "high");
  }
  if (!deal.primaryPainPoint) {
    add("Capture primary pain point", "Primary pain point not set", "high");
  }
  if (!deal.budgetRange) {
    add("Confirm budget range", "Budget not set", "high");
  }
  if (!hasResearch && deal.accountId) {
    add("Research company website", "No research profile for this account", "high");
  }
  if (!hasResearch && !deal.accountId) {
    add("Add account then research", "Account and research missing", "medium");
  }
  if (!deal.expectedCloseAt && ["qualified", "proposal_ready", "negotiation"].includes(stage)) {
    add("Confirm timeline", "Expected close date missing", "high");
  }
  if (stage === "proposal_ready") {
    add("Prepare proposal notes", "Ready for proposal", "high");
  }
  if (stage === "qualified" || stage === "proposal_ready") {
    add("Schedule discovery call", "Lead is qualified", "medium");
  }
  if (["new_lead", "researching"].includes(stage) && (deal.leadScore ?? 0) < 20) {
    add("Consider nurture track", "Low engagement score", "low");
  }
  if (!deal.serviceInterest) {
    add("Capture service interest", "Service interest not set", "medium");
  }
  if (actions.length === 0) {
    add("Schedule follow-up", "Keep momentum", "medium");
  }

  const order: NextBestAction["priority"][] = ["high", "medium", "low"];
  actions.sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority));
  return actions.slice(0, 6);
}

/** Stub: generate research summary from profile (Stage 1 = pass-through; Stage 2 can add LLM). */
export function generateResearchSummary(profile: CrmResearchProfile | null): string {
  if (!profile) return "";
  const parts: string[] = [];
  if (profile.companySummary) parts.push(profile.companySummary);
  if (profile.likelyPainPoints) parts.push(`Likely pain points: ${profile.likelyPainPoints}`);
  if (profile.suggestedServiceFit) parts.push(`Service fit: ${profile.suggestedServiceFit}`);
  if (profile.suggestedOutreachAngle) parts.push(`Outreach angle: ${profile.suggestedOutreachAngle}`);
  if (profile.aiGeneratedSummary) parts.push(profile.aiGeneratedSummary);
  return parts.join("\n\n") || "No summary yet.";
}

export type ActivityLogType =
  | "note"
  | "form_submission"
  | "status_change"
  | "stage_change"
  | "task_created"
  | "task_completed"
  | "research_updated"
  | "score_recalculated"
  | "contact_created"
  | "account_created"
  | "lead_created"
  | "ai_guidance_generated"
  | "ai_recommendation_accepted"
  | "ai_recommendation_dismissed"
  | "discovery_workspace_created"
  | "discovery_workspace_updated"
  | "proposal_prep_created"
  | "proposal_prep_updated"
  | "revenue_ops_sms_inbound"
  | "revenue_ops_sms_outbound"
  | "revenue_ops_call_inbound"
  | "revenue_ops_missed_call"
  | "revenue_ops_welcome_sms"
  | "revenue_ops_booking_link_sent"
  | "revenue_ops_booking_link_click"
  | "revenue_ops_booking_confirmed"
  | "revenue_ops_deposit_link_sent"
  | "revenue_ops_payment_completed"
  /** Lead Control System — logged communication attempts (not a dialer) */
  | "lead_control_call_attempted"
  | "lead_control_voicemail_left"
  | "lead_control_email_sent"
  | "lead_control_sms_marked"
  | "lead_control_meeting_started"
  | "lead_control_copy_contact"
  | "lead_control_note";

export interface LogActivityPayload {
  contactId?: number;
  accountId?: number;
  dealId?: number;
  taskId?: number;
  type: ActivityLogType;
  title: string;
  content?: string;
  metadata?: Record<string, unknown>;
  createdByUserId?: number;
}

/** Create a unified activity log entry. */
export async function logActivity(storage: IStorage, payload: LogActivityPayload): Promise<void> {
  await storage.createCrmActivityLog({
    contactId: payload.contactId ?? null,
    accountId: payload.accountId ?? null,
    dealId: payload.dealId ?? null,
    taskId: payload.taskId ?? null,
    type: payload.type,
    title: payload.title,
    content: payload.content ?? null,
    metadata: payload.metadata ?? null,
    createdByUserId: payload.createdByUserId ?? null,
  });
}
