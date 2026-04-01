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
  /** Admin CRM import: growth_diagnosis_engine | growth_funnel_quiz | project_assessment */
  intakeSource?: string;
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
  /** Offer valuation lead magnet metadata */
  valuationPersona?: string;
  latestOfferValuationName?: string;
  latestOfferValuationScore?: number;
  latestOfferValuationAt?: string;
  /** Free growth tools hub — optional note on which tools they want */
  freeToolsInterest?: string;
  /** ISO timestamp when hub qualification was submitted */
  freeToolsHubSubmittedAt?: string;
  /**
   * Inferred from first-party visitor tracking (headers / edge) when `visitorId` is present on form submit.
   * Stored on the CRM lead’s `customFields`; not a substitute for GA4 aggregates or self-reported form answers.
   */
  inferredCountry?: string;
  inferredRegion?: string;
  inferredCity?: string;
  inferredDeviceType?: string;
  inferredTimezone?: string;
  /** ISO time when inferred* snapshot was merged from visitor activity */
  inferredFromVisitorTrackingAt?: string;
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
