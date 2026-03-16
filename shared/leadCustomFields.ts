/**
 * Typed shape for crm_contacts.customFields used by lead intelligence (forms, admin, segmentation).
 * Store businessType, teamSize, pain points, goals, budget ranges here; core fields stay on the contact.
 */
export interface LeadCustomFields {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  websiteUrl?: string;
  role?: string;
  businessType?: string;
  industry?: string;
  teamSize?: string;
  monthlyRevenueRange?: string;
  estimatedMarketingBudget?: string;
  serviceInterest?: string | string[];
  biggestPainPoint?: string;
  primaryGoal?: string;
  urgencyLevel?: string;
  campaign?: string;
  medium?: string;
  referringPage?: string;
  landingPage?: string;
  /** First-touch attribution (source) */
  firstTouchSource?: string;
  firstTouchMedium?: string;
  firstTouchCampaign?: string;
  /** Nurture state for sequences */
  nurtureState?: string;
  [key: string]: unknown;
}

export function getLeadCustomFields(fields: Record<string, unknown> | null | undefined): LeadCustomFields {
  if (!fields || typeof fields !== "object") return {};
  return fields as LeadCustomFields;
}
