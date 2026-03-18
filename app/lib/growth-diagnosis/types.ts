/**
 * Ascendra Growth Diagnosis Engine — data types.
 * All findings are evidence-based; no internal formulas exposed to clients.
 */

export type AuditBusinessType =
  | "local_service"
  | "skilled_trades"
  | "consultant"
  | "agency"
  | "startup_saas"
  | "unsure";

export type AuditPrimaryGoal =
  | "get_more_leads"
  | "improve_trust"
  | "increase_bookings"
  | "improve_local_seo"
  | "identify_blockers";

export interface AuditRequest {
  url: string;
  businessType?: AuditBusinessType;
  primaryGoal?: AuditPrimaryGoal;
  email?: string;
  demoMode?: boolean;
}

export interface ExtractedPage {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  h1Texts: string[];
  headings: { level: number; text: string }[];
  paragraphCount: number;
  wordCount: number;
  ctaButtons: { text: string; visible: boolean }[];
  hasForm: boolean;
  hasPhoneLink: boolean;
  hasEmailLink: boolean;
  internalLinks: number;
  externalLinks: number;
  imageCount: number;
  imagesWithAlt: number;
  hasSchema: boolean;
  trustSignals: string[];
  locationMentions: number;
  socialLinks: string[];
  viewportMeta: boolean;
}

export type VerificationStatus =
  | "pending"
  | "in_progress"
  | "verified"
  | "partial"
  | "failed"
  | "low_confidence";

export type FindingClassification = "confirmed_issue" | "improvement_opportunity" | "strong_area";

export type Severity = "critical" | "high" | "medium" | "low" | "positive";

export interface AuditIssue {
  id: string;
  category: AuditCategoryKey;
  severity: Severity;
  classification: FindingClassification;
  title: string;
  description: string;
  evidence: string;
  impact: string;
  recommendation: string;
  confidenceLevel: "high" | "medium" | "low";
  pageUrl?: string;
  pageReference?: string;
  verificationStatus: VerificationStatus;
}

export type AuditCategoryKey =
  | "performance"
  | "seo_foundations"
  | "conversion_readiness"
  | "mobile_experience"
  | "trust_authority"
  | "content_clarity"
  | "accessibility_basics"
  | "local_visibility";

export interface AuditCategoryScore {
  key: AuditCategoryKey;
  label: string;
  score: number;
  maxScore: number;
  explanation: string;
  evidenceSummary: string;
  priority: "high" | "medium" | "low";
  recommendedFixes: string[];
}

export interface AuditRecommendation {
  id: string;
  type: "blocker" | "quick_win" | "opportunity";
  title: string;
  description: string;
  impact: string;
  recommendation?: string;
  category: AuditCategoryKey;
  severity: Severity;
}

export interface AuditSummary {
  overallScore: number;
  gradeTier: string;
  gradeLabel: string;
  websitePerformanceScore: number;
  startupWebsiteScore: number;
  topBlockers: AuditRecommendation[];
  quickWins: AuditRecommendation[];
  categoryScores: AuditCategoryScore[];
  totalFindings: number;
  confirmedIssues: number;
  improvementOpportunities: number;
}

export interface WebsitePerformanceScore {
  score: number;
  label: string;
  explanation: string;
  evidenceSummary: string;
}

export interface StartupWebsiteScore {
  score: number;
  label: string;
  explanation: string;
  evidenceSummary: string;
}

export interface AuditReport {
  id: string;
  request: AuditRequest;
  status: "completed" | "failed" | "partial";
  createdAt: string;
  pagesAnalyzed: number;
  pages: ExtractedPage[];
  issues: AuditIssue[];
  summary: AuditSummary;
  websitePerformanceScore: WebsitePerformanceScore;
  startupWebsiteScore: StartupWebsiteScore;
}

export interface VerificationCheck {
  ruleId: string;
  status: VerificationStatus;
  evidenceMatch: boolean;
  message?: string;
}

export interface VerificationSummary {
  total: number;
  verified: number;
  partial: number;
  failed: number;
}

export interface PremiumUpsellState {
  showUpsell: boolean;
  variant: "low" | "mid" | "high";
  ctaTitle: string;
  ctaDescription: string;
}
