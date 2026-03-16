/**
 * Stage 2: Profile completeness and missing-data indicators.
 * Used for badges, warnings, and prioritization.
 */

import type { CrmContact } from "@shared/crmSchema";
import type { CrmAccount } from "@shared/crmSchema";
import type { CrmDeal } from "@shared/crmSchema";
import type { CrmResearchProfile } from "@shared/crmSchema";

export interface CompletenessResult {
  score: number; // 0-100
  missingFields: string[];
  label: "complete" | "good" | "partial" | "minimal";
}

const CONTACT_FIELDS: { key: keyof CrmContact; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "company", label: "Company" },
  { key: "jobTitle", label: "Job title" },
  { key: "industry", label: "Industry" },
  { key: "source", label: "Source" },
  { key: "linkedinUrl", label: "LinkedIn" },
  { key: "websiteUrl", label: "Website URL" },
];

export function getContactCompleteness(contact: CrmContact): CompletenessResult {
  const missing: string[] = [];
  for (const { key, label } of CONTACT_FIELDS) {
    const v = contact[key];
    if (v == null || (typeof v === "string" && v.trim() === "")) missing.push(label);
  }
  const filled = CONTACT_FIELDS.length - missing.length;
  const score = Math.round((filled / CONTACT_FIELDS.length) * 100);
  let label: CompletenessResult["label"] = "minimal";
  if (score >= 90) label = "complete";
  else if (score >= 70) label = "good";
  else if (score >= 50) label = "partial";
  return { score, missingFields: missing, label };
}

const ACCOUNT_FIELDS: { key: keyof CrmAccount; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "website", label: "Website" },
  { key: "industry", label: "Industry" },
  { key: "businessType", label: "Business type" },
  { key: "companySize", label: "Company size" },
  { key: "accountStatus", label: "Status" },
];

export function getAccountCompleteness(account: CrmAccount): CompletenessResult {
  const missing: string[] = [];
  for (const { key, label } of ACCOUNT_FIELDS) {
    const v = account[key];
    if (v == null || (typeof v === "string" && v.trim() === "")) missing.push(label);
  }
  const filled = ACCOUNT_FIELDS.length - missing.length;
  const score = Math.round((filled / ACCOUNT_FIELDS.length) * 100);
  let label: CompletenessResult["label"] = "minimal";
  if (score >= 90) label = "complete";
  else if (score >= 70) label = "good";
  else if (score >= 50) label = "partial";
  return { score, missingFields: missing, label };
}

const DEAL_FIELDS: { key: keyof CrmDeal; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "contactId", label: "Contact" },
  { key: "serviceInterest", label: "Service interest" },
  { key: "primaryPainPoint", label: "Primary pain point" },
  { key: "businessGoal", label: "Business goal" },
  { key: "urgencyLevel", label: "Urgency" },
  { key: "budgetRange", label: "Budget range" },
  { key: "expectedCloseAt", label: "Expected close date" },
  { key: "source", label: "Source" },
];

export function getDealCompleteness(deal: CrmDeal): CompletenessResult {
  const missing: string[] = [];
  for (const { key, label } of DEAL_FIELDS) {
    if (key === "contactId") {
      if (deal.contactId == null) missing.push(label);
      continue;
    }
    const v = deal[key as keyof CrmDeal];
    if (v == null || (typeof v === "string" && v.trim() === "")) missing.push(label);
  }
  const filled = DEAL_FIELDS.length - missing.length;
  const score = Math.round((filled / DEAL_FIELDS.length) * 100);
  let label: CompletenessResult["label"] = "minimal";
  if (score >= 90) label = "complete";
  else if (score >= 70) label = "good";
  else if (score >= 50) label = "partial";
  return { score, missingFields: missing, label };
}

const RESEARCH_FIELDS: { key: keyof CrmResearchProfile; label: string }[] = [
  { key: "companySummary", label: "Company summary" },
  { key: "websiteFindings", label: "Website findings" },
  { key: "likelyPainPoints", label: "Likely pain points" },
  { key: "suggestedServiceFit", label: "Suggested service fit" },
  { key: "suggestedOutreachAngle", label: "Outreach angle" },
];

export function getResearchCompleteness(profile: CrmResearchProfile | null): CompletenessResult {
  if (!profile) {
    return { score: 0, missingFields: RESEARCH_FIELDS.map((f) => f.label), label: "minimal" };
  }
  const missing: string[] = [];
  for (const { key, label } of RESEARCH_FIELDS) {
    const v = profile[key];
    if (v == null || (typeof v === "string" && v.trim() === "")) missing.push(label);
  }
  const filled = RESEARCH_FIELDS.length - missing.length;
  const score = Math.round((filled / RESEARCH_FIELDS.length) * 100);
  let label: CompletenessResult["label"] = "minimal";
  if (score >= 90) label = "complete";
  else if (score >= 70) label = "good";
  else if (score >= 50) label = "partial";
  return { score, missingFields: missing, label };
}
