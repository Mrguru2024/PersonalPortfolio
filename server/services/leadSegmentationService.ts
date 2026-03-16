/**
 * Lead segmentation: assign segment tags from profile data and behavior.
 * Tags are stored on crm_contacts.tags (string[]). Run after lead create/update or from workflow.
 */

import type { CrmContact } from "@shared/crmSchema";
import type { VisitorActivity } from "@shared/crmSchema";
import { getLeadCustomFields } from "@shared/leadCustomFields";

export const SEGMENT_TAGS = [
  "startup_founder",
  "local_service_business",
  "ecommerce",
  "redesign_lead",
  "funnel_lead",
  "branding_plus_web",
  "audit_interested",
  "high_intent",
  "low_intent",
  "nurture_only",
  "sales_ready",
] as const;

export type SegmentTag = (typeof SEGMENT_TAGS)[number];

export interface SegmentationInput {
  contact: CrmContact;
  recentEvents?: VisitorActivity[];
  /** Override or supplement: e.g. just completed audit, calculator, booking */
  recentSignals?: {
    completedAudit?: boolean;
    completedCalculator?: boolean;
    bookedCall?: boolean;
    downloadedLeadMagnet?: boolean;
  };
}

/**
 * Compute segment tags from contact profile and recent behavior.
 * Returns a deduplicated list of tags to set (merge with existing if desired).
 */
export function computeSegmentTags(input: SegmentationInput): string[] {
  const { contact, recentEvents = [], recentSignals = {} } = input;
  const tags = new Set<string>();
  const custom = getLeadCustomFields(contact.customFields);
  const score = contact.leadScore ?? 0;
  const lifecycle = contact.lifecycleStage ?? "";

  // Intent / lifecycle
  if (score >= 80 || lifecycle === "sales_ready") tags.add("sales_ready");
  else if (score >= 50 || contact.intentLevel === "high_intent" || contact.intentLevel === "hot_lead") tags.add("high_intent");
  else if (score < 25 && recentEvents.length < 2) tags.add("low_intent");
  if (score > 0 && score < 50 && !tags.has("sales_ready")) tags.add("nurture_only");

  // Business type from customFields or company/industry
  const businessType = (custom.businessType ?? "").toLowerCase();
  const industry = (custom.industry ?? contact.industry ?? "").toLowerCase();
  const serviceInterest = Array.isArray(custom.serviceInterest)
    ? custom.serviceInterest.join(" ").toLowerCase()
    : (custom.serviceInterest ?? "").toString().toLowerCase();

  if (businessType.includes("startup") || industry.includes("startup")) tags.add("startup_founder");
  if (businessType.includes("local") || businessType.includes("service") || industry.includes("local")) tags.add("local_service_business");
  if (businessType.includes("ecommerce") || industry.includes("ecommerce") || serviceInterest.includes("ecommerce")) tags.add("ecommerce");

  // Service interest
  if (serviceInterest.includes("redesign") || serviceInterest.includes("website redesign")) tags.add("redesign_lead");
  if (serviceInterest.includes("funnel") || serviceInterest.includes("conversion")) tags.add("funnel_lead");
  if (serviceInterest.includes("brand") && (serviceInterest.includes("web") || serviceInterest.includes("website"))) tags.add("branding_plus_web");

  // Behavior
  if (recentSignals.completedAudit) tags.add("audit_interested");
  const completedAuditEvent = recentEvents.some((e) => e.eventType === "audit_tool_complete" || e.eventType === "audit_complete");
  if (completedAuditEvent) tags.add("audit_interested");
  if (recentSignals.completedCalculator || recentEvents.some((e) => e.eventType === "calculator_complete")) {
    tags.add("high_intent");
  }
  if (recentSignals.bookedCall || contact.bookedCallAt) tags.add("sales_ready");

  return [...tags];
}

/**
 * Merge computed tags with existing contact tags (no duplicates, preserve existing that are still valid).
 */
export function mergeSegmentTags(existingTags: string[] | null | undefined, computed: string[]): string[] {
  const set = new Set(existingTags ?? []);
  for (const t of computed) set.add(t);
  return [...set];
}
