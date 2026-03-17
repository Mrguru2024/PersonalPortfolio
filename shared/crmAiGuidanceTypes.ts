/**
 * Stage 3: Structured AI guidance output types.
 * Used by rule-based and (future) LLM providers and persisted in crm_ai_guidance.
 */

export type AiPriorityLabel =
  | "low_priority"
  | "nurture"
  | "watchlist"
  | "active"
  | "high_value"
  | "proposal_ready"
  | "urgent_attention";

export interface LeadSummaryOutput {
  shortSummary: string;
  whyThisLeadMatters: string;
  strongestOpportunitySignals: string[];
  likelyBusinessProblem: string;
  likelyServiceFit: string;
  qualificationCompleteness: number;
  missingData: string[];
  urgencyAssessment: string;
  confidenceRating: number;
  suggestedNext3Actions: string[];
}

export interface AccountSummaryOutput {
  businessSummary: string;
  websiteMaturitySummary: string;
  likelyGrowthIssues: string[];
  likelyConversionIssues: string[];
  likelyDesignUxIssues: string[];
  likelyAutomationOpportunities: string[];
  serviceFitSummary: string;
  strategicOpportunityLevel: string;
}

export interface ContactSummaryOutput {
  shortSummary: string;
  relationshipNotes: string;
  suggestedNextConversationAngle: string;
  missingInfoPrompts: string[];
}

export interface OpportunityAssessmentOutput {
  summary: string;
  strengthSignals: string[];
  risks: string[];
  readiness: string;
  suggestedFocus: string[];
}

export interface NextBestActionItem {
  id: string;
  label: string;
  reason: string;
  priority: "high" | "medium" | "low";
  relatedEntityType?: "contact" | "account" | "deal";
  relatedEntityId?: number;
  actionCategory: string;
  confidence: number;
  suggestedDueTiming?: string;
}

export interface DiscoveryQuestionsOutput {
  topQuestions: string[];
  riskQuestions: string[];
  budgetTimelineQuestions: string[];
  websiteFunnelQuestions: string[];
  operationalQuestions: string[];
  serviceFitConfirmationQuestions: string[];
}

export interface ProposalPrepOutput {
  likelyOfferDirection: string;
  expectedScopeThemes: string[];
  possibleUpsellCrossSell: string[];
  proposalPreparationNotes: string[];
  assumptionsRequiringValidation: string[];
  pricingCautionNotes: string[];
  deliverablesToConfirm: string[];
}

export interface RiskWarningsOutput {
  warnings: Array<{ code: string; label: string; severity: "high" | "medium" | "low" }>;
}

export interface QualificationGapOutput {
  missingFields: string[];
  weakQualificationAreas: string[];
  missingRiskItems: string[];
  missingDecisionMakerClarity: boolean;
  missingBudgetClarity: boolean;
  missingTimelineClarity: boolean;
  missingWebsiteFunnelClarity: boolean;
  overallCompletenessScore: number;
}

export interface ResearchSummaryOutput {
  summary: string;
  recommendedServiceFit: string;
  outreachAngle: string;
  keyIssues: string[];
}

export interface AiPriorityOutput {
  aiPriorityScore: number;
  priorityLabel: AiPriorityLabel;
  rationaleSummary: string;
}

export type AiGuidanceOutputType =
  | "lead_summary"
  | "account_summary"
  | "contact_summary"
  | "opportunity_assessment"
  | "research_summary"
  | "next_best_actions"
  | "discovery_questions"
  | "proposal_prep"
  | "risk_warnings"
  | "qualification_gaps"
  | "follow_up_angle"
  | "ai_priority";
