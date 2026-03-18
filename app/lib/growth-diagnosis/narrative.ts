/**
 * Ascendra Growth Diagnosis Engine — evidence-based narrative layer.
 * Builds plain-language summary from verified findings only; no LLM, no invented content.
 */

import type { AuditIssue, AuditSummary, AuditReport } from "./types";
import { getVerificationSummary } from "./verification";

export interface NarrativeSection {
  title: string;
  body: string;
}

/** Build a short narrative summary from the report (evidence-based only). */
export function buildEvidenceNarrative(report: AuditReport): NarrativeSection[] {
  const sections: NarrativeSection[] = [];
  const { summary, issues = [] } = report;
  const verification = getVerificationSummary(issues as Parameters<typeof getVerificationSummary>[0]);

  sections.push({
    title: "Overall",
    body: `This site received a Growth Readiness Score of ${summary.overallScore} (${summary.gradeLabel}). We reviewed ${report.pagesAnalyzed} page(s) and found ${summary.totalFindings} finding(s): ${summary.confirmedIssues} confirmed issue(s) and ${summary.improvementOpportunities} improvement opportunity(ies). ${verification.verified} finding(s) were verified against the page content.`,
  });

  if (summary.topBlockers.length > 0) {
    sections.push({
      title: "Where your site may be losing potential customers",
      body: summary.topBlockers
        .map(
          (b) =>
            `${b.title}. ${b.impact} Recommended: ${b.recommendation ?? b.impact}`
        )
        .join(" "),
    });
  }

  if (summary.quickWins.length > 0) {
    sections.push({
      title: "Quick wins",
      body: `These improvements can help: ${summary.quickWins.map((q) => q.title).join("; ")}.`,
    });
  }

  const performanceNote =
    summary.websitePerformanceScore < 60
      ? " Performance and usability need attention."
      : summary.websitePerformanceScore < 75
        ? " There is room to improve performance and usability."
        : "";
  sections.push({
    title: "Performance and readiness",
    body: `Website Performance Score: ${report.websitePerformanceScore.score}. Startup Website Score: ${report.startupWebsiteScore.score}.${performanceNote}`,
  });

  return sections;
}

/** Single narrative paragraph for email or export (evidence-based). */
export function buildNarrativeParagraph(report: AuditReport): string {
  const sections = buildEvidenceNarrative(report);
  return sections.map((s) => `${s.title}: ${s.body}`).join("\n\n");
}
