/**
 * Ascendra Growth Diagnosis Engine — demo/mock report.
 * Used when demoMode is true or when live crawl is unavailable.
 */

import type { AuditReport, AuditRequest } from "./types";
import { CATEGORY_LABELS } from "./constants";
import type { AuditCategoryKey } from "./types";

function demoReportId(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function buildDemoReport(request: AuditRequest): AuditReport {
  const id = demoReportId();
  const now = new Date().toISOString();
  const categoryKeys: AuditCategoryKey[] = [
    "performance",
    "seo_foundations",
    "conversion_readiness",
    "mobile_experience",
    "trust_authority",
    "content_clarity",
    "accessibility_basics",
    "local_visibility",
  ];
  const categoryScores = categoryKeys.map((key, i) => ({
    key,
    label: CATEGORY_LABELS[key],
    score: [72, 65, 58, 78, 62, 68, 75, 55][i],
    maxScore: 100,
    explanation:
      [72, 65, 58, 78, 62, 68, 75, 55][i] >= 75
        ? "This area looks strong based on what we reviewed."
        : "There are some opportunities to improve here.",
    evidenceSummary: "Based on demo scan of your site.",
    priority: ([72, 65, 58, 78, 62, 68, 75, 55][i] < 50 ? "high" : "medium") as "high" | "medium" | "low",
    recommendedFixes: [
      "Add a clear, descriptive title (around 50–60 characters).",
      "Add a high-visibility primary CTA above the fold.",
      "Add a simple form so visitors can take the next step.",
    ].slice(0, 2),
  }));
  const overallScore = 66;
  const websitePerformanceScore = {
    score: 70,
    label: "Website Performance Score",
    explanation:
      "This score reflects how strong your site is from a performance and usability standpoint.",
    evidenceSummary: "Based on the same evidence we use for your category scores.",
  };
  const startupWebsiteScore = {
    score: 62,
    label: "Startup Website Score",
    explanation:
      "This score reflects how ready your site is to attract interest, build trust, and capture signups.",
    evidenceSummary: "Based on the same evidence we use for your category scores.",
  };
  const issues = [
    {
      id: "demo-cta-missing",
      category: "conversion_readiness" as AuditCategoryKey,
      severity: "high" as const,
      classification: "confirmed_issue" as const,
      title: "No clear call to action",
      description: "We didn't find a clear button or link that tells visitors what to do next.",
      evidence: "No CTA-like buttons or links detected.",
      impact: "Visitors may leave without taking the next step.",
      recommendation: "Add a high-visibility primary CTA above the fold and repeat it in key sections.",
      confidenceLevel: "high" as const,
      verificationStatus: "verified" as const,
    },
    {
      id: "demo-trust-signals-missing",
      category: "trust_authority" as AuditCategoryKey,
      severity: "medium" as const,
      classification: "improvement_opportunity" as const,
      title: "No obvious trust elements",
      description: "We didn't find clear trust signals (e.g. testimonials, reviews) on the main page.",
      evidence: "No testimonial/review/trust sections detected.",
      impact: "New visitors may be less likely to convert without social proof.",
      recommendation: "Add a short testimonial or credentials section above the fold or near the CTA.",
      confidenceLevel: "high" as const,
      verificationStatus: "verified" as const,
    },
    {
      id: "demo-meta-description-weak",
      category: "seo_foundations" as AuditCategoryKey,
      severity: "medium" as const,
      classification: "improvement_opportunity" as const,
      title: "Missing or weak meta description",
      description: "This page has no meta description or one that is too short.",
      evidence: "Meta description: none or very short.",
      impact: "Search engines may show a generic snippet, which can reduce clicks.",
      recommendation: "Add a meta description of about 150–160 characters.",
      confidenceLevel: "medium" as const,
      verificationStatus: "partial" as const,
    },
  ];
  const summary = {
    overallScore,
    gradeTier: "Needs Improvement",
    gradeLabel: "Needs Improvement",
    websitePerformanceScore: websitePerformanceScore.score,
    startupWebsiteScore: startupWebsiteScore.score,
    topBlockers: [
      {
        id: "demo-cta-missing",
        type: "blocker" as const,
        title: "No clear call to action",
        description: "We didn't find a clear button or link that tells visitors what to do next.",
        impact: "Visitors may leave without taking the next step.",
        category: "conversion_readiness" as AuditCategoryKey,
        severity: "high" as const,
      },
    ],
    quickWins: [
      {
        id: "demo-trust-signals-missing",
        type: "quick_win" as const,
        title: "Add trust elements",
        description: "Add a short testimonial or credentials section.",
        impact: "Can improve trust and conversion.",
        category: "trust_authority" as AuditCategoryKey,
        severity: "medium" as const,
      },
      {
        id: "demo-meta-description-weak",
        type: "quick_win" as const,
        title: "Improve meta description",
        description: "Add a meta description of about 150–160 characters.",
        impact: "Better appearance in search results.",
        category: "seo_foundations" as AuditCategoryKey,
        severity: "medium" as const,
      },
    ],
    categoryScores,
    totalFindings: issues.length,
    confirmedIssues: 1,
    improvementOpportunities: 2,
  };
  return {
    id,
    request,
    status: "completed",
    createdAt: now,
    pagesAnalyzed: 1,
    pages: [
      {
        url: request.url,
        title: "Home",
        metaDescription: null,
        h1Count: 1,
        h1Texts: ["Welcome"],
        headings: [{ level: 1, text: "Welcome" }],
        paragraphCount: 3,
        wordCount: 120,
        ctaButtons: [],
        hasForm: false,
        hasPhoneLink: false,
        hasEmailLink: true,
        internalLinks: 5,
        externalLinks: 2,
        imageCount: 4,
        imagesWithAlt: 2,
        hasSchema: false,
        trustSignals: [],
        locationMentions: 0,
        socialLinks: [],
        viewportMeta: true,
      },
    ],
    issues,
    summary,
    websitePerformanceScore,
    startupWebsiteScore,
  };
}
