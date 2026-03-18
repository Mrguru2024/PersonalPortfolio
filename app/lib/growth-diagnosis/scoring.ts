/**
 * Ascendra Growth Diagnosis Engine — scoring.
 * Weighted category scores, overall Growth Readiness, Website Performance Score, Startup Website Score.
 * Weights are configurable by business profile; formulas are not exposed to clients.
 */

import type {
  AuditIssue,
  AuditCategoryScore,
  AuditSummary,
  WebsitePerformanceScore,
  StartupWebsiteScore,
  AuditRecommendation,
  ExtractedPage,
  AuditCategoryKey,
} from "./types";
import {
  CATEGORY_LABELS,
  GRADE_TIERS,
  WEBSITE_PERFORMANCE_WEIGHTS,
  STARTUP_WEBSITE_WEIGHTS,
  getWeightsForProfile,
} from "./constants";
import type { AuditBusinessProfile } from "./constants";

const SEVERITY_PENALTY: Record<string, number> = {
  critical: 25,
  high: 18,
  medium: 10,
  low: 5,
  positive: 0,
};

const MAX_SCORE = 100;

function categoryScoreFromIssues(issues: AuditIssue[], category: AuditCategoryKey): number {
  const catIssues = issues.filter((i) => i.category === category);
  if (catIssues.length === 0) return MAX_SCORE;
  const penalty = catIssues.reduce((sum, i) => sum + (SEVERITY_PENALTY[i.severity] ?? 10), 0);
  return Math.max(0, Math.min(MAX_SCORE, MAX_SCORE - penalty));
}

function getGradeTier(score: number): { label: string } {
  const tier = GRADE_TIERS.find((t) => score >= t.min && score <= t.max);
  return { label: tier?.label ?? "Needs Improvement" };
}

export function computeCategoryScores(
  issues: AuditIssue[],
  pages: ExtractedPage[]
): AuditCategoryScore[] {
  const keys: AuditCategoryKey[] = [
    "performance",
    "seo_foundations",
    "conversion_readiness",
    "mobile_experience",
    "trust_authority",
    "content_clarity",
    "accessibility_basics",
    "local_visibility",
  ];
  return keys.map((key) => {
    const score = categoryScoreFromIssues(issues, key);
    const catIssues = issues.filter((i) => i.category === key);
    const explanation =
      score >= 75
        ? "This area looks strong based on what we reviewed."
        : score >= 50
          ? "There are some opportunities to improve here."
          : "This area needs attention to support growth.";
    const evidenceSummary =
      catIssues.length === 0
        ? "No issues found in this category."
        : `${catIssues.length} finding${catIssues.length === 1 ? "" : "s"} in this category.`;
    const priority: "high" | "medium" | "low" =
      score < 50 ? "high" : score < 75 ? "medium" : "low";
    const recommendedFixes = catIssues.slice(0, 3).map((i) => i.recommendation);
    return {
      key,
      label: CATEGORY_LABELS[key],
      score,
      maxScore: MAX_SCORE,
      explanation,
      evidenceSummary,
      priority,
      recommendedFixes,
    };
  });
}

export function weightedOverall(
  categoryScores: AuditCategoryScore[],
  weights: Record<AuditCategoryKey, number>
): number {
  let total = 0;
  let weightSum = 0;
  categoryScores.forEach((c) => {
    const w = weights[c.key] ?? 0;
    total += c.score * w;
    weightSum += w;
  });
  if (weightSum === 0) return 0;
  return Math.round((total / weightSum));
}

export function computeWebsitePerformanceScore(categoryScores: AuditCategoryScore[]): WebsitePerformanceScore {
  const weights = WEBSITE_PERFORMANCE_WEIGHTS as Record<AuditCategoryKey, number>;
  const score = Math.min(MAX_SCORE, weightedOverall(categoryScores, weights));
  const explanation =
    "This score reflects how strong your site is from a performance and usability standpoint: load and structure, mobile experience, accessibility basics, and clarity of navigation and next steps.";
  const evidenceSummary = "Based on the same evidence we use for your category scores, with emphasis on performance, SEO foundations, mobile, and accessibility.";
  return {
    score,
    label: "Website Performance Score",
    explanation,
    evidenceSummary,
  };
}

export function computeStartupWebsiteScore(categoryScores: AuditCategoryScore[]): StartupWebsiteScore {
  const weights = STARTUP_WEBSITE_WEIGHTS as Record<AuditCategoryKey, number>;
  const score = Math.min(MAX_SCORE, weightedOverall(categoryScores, weights));
  const explanation =
    "This score reflects how ready your site is to help you attract interest, build trust, and capture signups or early traction: clarity of offer, trust signals, conversion flow, and messaging.";
  const evidenceSummary = "Based on the same evidence we use for your category scores, with emphasis on conversion readiness, trust, and content clarity.";
  return {
    score,
    label: "Startup Website Score",
    explanation,
    evidenceSummary,
  };
}

export function issuesToRecommendations(issues: AuditIssue[]): AuditRecommendation[] {
  const bySeverity = (a: AuditIssue, b: AuditIssue) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3, positive: 4 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  };
  const criticalHigh = issues.filter((i) => i.severity === "critical" || i.severity === "high").sort(bySeverity);
  const medium = issues.filter((i) => i.severity === "medium").sort(bySeverity);
  const blockers: AuditRecommendation[] = criticalHigh.slice(0, 5).map((i) => ({
    id: i.id,
    type: "blocker",
    title: i.title,
    description: i.description,
    impact: i.impact,
    recommendation: i.recommendation,
    category: i.category,
    severity: i.severity,
  }));
  const quickWins: AuditRecommendation[] = medium.slice(0, 5).map((i) => ({
    id: i.id,
    type: "quick_win",
    title: i.title,
    description: i.description,
    impact: i.impact,
    recommendation: i.recommendation,
    category: i.category,
    severity: i.severity,
  }));
  return [...blockers, ...quickWins];
}

export function buildSummary(
  issues: AuditIssue[],
  categoryScores: AuditCategoryScore[],
  websitePerf: WebsitePerformanceScore,
  startupScore: StartupWebsiteScore,
  businessProfile?: AuditBusinessProfile
): AuditSummary {
  const weights = getWeightsForProfile(businessProfile);
  const overallScore = Math.round(
    weightedOverall(categoryScores, weights)
  );
  const { label: gradeLabel } = getGradeTier(overallScore);
  const topBlockers = issuesToRecommendations(issues).filter((r) => r.type === "blocker").slice(0, 3);
  const quickWins = issuesToRecommendations(issues).filter((r) => r.type === "quick_win").slice(0, 3);
  const confirmedIssues = issues.filter((i) => i.classification === "confirmed_issue").length;
  const improvementOpportunities = issues.filter((i) => i.classification === "improvement_opportunity").length;
  return {
    overallScore,
    gradeTier: getGradeTier(overallScore).label,
    gradeLabel,
    websitePerformanceScore: websitePerf.score,
    startupWebsiteScore: startupScore.score,
    topBlockers,
    quickWins,
    categoryScores,
    totalFindings: issues.length,
    confirmedIssues,
    improvementOpportunities,
  };
}
