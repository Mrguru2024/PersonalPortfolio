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
  /** Paid challenge: joined | active | completed */
  challengeStatus?: string;
  orderBumpPurchased?: boolean;
  /** Growth diagnosis total 0–100 */
  diagnosisScore?: number;
  diagnosisBreakdown?: { brand: number; design: number; system: number };
  /** ascendra | style-studio | macon-designs */
  recommendedBrandPath?: string;
  qualificationSubmitted?: boolean;
  readyForCall?: boolean;
  /** Challenge qualification form */
  mainGoal?: string;
  websiteStatus?: string;
  leadGenProblem?: string;
  budgetRange?: string;
  timeline?: string;
  implementationInterest?: string;
  notes?: string;
  [key: string]: unknown;
}

export function getLeadCustomFields(fields: Record<string, unknown> | null | undefined): LeadCustomFields {
  if (!fields || typeof fields !== "object") return {};
  return fields as LeadCustomFields;
}
