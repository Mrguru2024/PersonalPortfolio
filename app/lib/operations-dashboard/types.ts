export interface OperationsSummaryStats {
  newDiagnosticsToReview: number;
  qualifiedLeads: number;
  draftCaseStudies: number;
  publishedCaseStudies: number;
  contentMissingKeyElements: number;
  itemsReadyToPublish: number;
}

export interface OperationsQuickAction {
  key: string;
  label: string;
  href: string;
  description: string;
  section: string;
}

export interface DiagnosticActivityRow {
  id: number;
  kind: "growth_diagnosis" | "funnel_lead";
  businessType: string;
  score: number | null;
  revenueOpportunity: string;
  recommendedSystem: string;
  createdAt: string;
  crmContactId: number | null;
  breakdownHref: string;
  recommendationHref: string;
}

export interface CaseStudyWorkflowItem {
  id: number;
  title: string;
  workflowStatus: string;
  completionScore: number;
  missingElements: string[];
  updatedAt: string;
  contentType: string;
  visibility: string;
  seoReady: boolean;
}

export interface PublishingQueueItem {
  id: number;
  title: string;
  workflowStatus: string;
  seoReady: boolean;
  updatedAt: string;
  slug: string | null;
}

export interface LeadSnapshotItem {
  contactId: number;
  leadName: string;
  business: string;
  source: string;
  opportunity: string;
  status: string;
  diagnosticHref: string;
}

export interface AiActionItem {
  key: string;
  label: string;
  description: string;
  href: string;
}

export interface ContentHealthIssue {
  label: string;
  count: number;
}

export interface ContentHealthSummary {
  averageCompletionScore: number;
  issues: ContentHealthIssue[];
}

export interface OperationsDashboardPayload {
  generatedAt: string;
  summary: OperationsSummaryStats;
  quickActions: OperationsQuickAction[];
  diagnostics: DiagnosticActivityRow[];
  caseStudies: CaseStudyWorkflowItem[];
  publishingQueue: PublishingQueueItem[];
  leads: LeadSnapshotItem[];
  aiActions: AiActionItem[];
  contentHealth: ContentHealthSummary;
}
