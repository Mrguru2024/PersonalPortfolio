/**
 * Ascendra Growth Diagnosis Engine — action verification layer.
 * Confirms findings against extracted evidence; reduces false positives.
 * Internal status only; not exposed to clients in raw form.
 */

import type { AuditIssue, ExtractedPage, VerificationCheck, VerificationSummary } from "./types";

export function verifyRuleEvidence(
  issue: AuditIssue,
  pages: ExtractedPage[]
): VerificationCheck {
  const page = issue.pageUrl ? pages.find((p) => p.url === issue.pageUrl) : pages[0];
  if (!page) {
    return { ruleId: issue.id, status: "failed", evidenceMatch: false, message: "Page not in crawl" };
  }

  let evidenceMatch = true;
  let status: VerificationCheck["status"] = "verified";

  if (issue.id === "title-missing-weak") {
    evidenceMatch = !page.title || page.title.length < 10;
  } else if (issue.id === "h1-missing") {
    evidenceMatch = page.h1Count === 0;
  } else if (issue.id === "h1-multiple") {
    evidenceMatch = page.h1Count > 1;
  } else if (issue.id === "cta-missing") {
    evidenceMatch = page.ctaButtons.length === 0;
  } else if (issue.id === "viewport-missing") {
    evidenceMatch = !page.viewportMeta;
  } else if (issue.id === "form-missing-contact") {
    evidenceMatch = !page.hasForm;
  } else if (issue.id === "trust-signals-missing") {
    evidenceMatch = page.trustSignals.length === 0;
  } else if (issue.id === "phone-not-clickable") {
    evidenceMatch = !page.hasPhoneLink;
  } else if (issue.id === "images-alt-missing") {
    evidenceMatch = page.imageCount > 0 && page.imagesWithAlt < page.imageCount;
  } else if (issue.id === "schema-missing") {
    evidenceMatch = !page.hasSchema;
  } else if (issue.id === "meta-description-weak") {
    evidenceMatch = !page.metaDescription || page.metaDescription.length < 30;
  } else if (issue.id === "content-thin") {
    evidenceMatch = page.paragraphCount > 0 && page.wordCount < 150;
  } else if (issue.id === "cta-weak") {
    evidenceMatch = page.ctaButtons.length === 1 && page.ctaButtons[0].text.length < 3;
  } else if (issue.id === "internal-links-weak") {
    evidenceMatch = page.internalLinks < 3;
  }
  if (!evidenceMatch && (issue.id === "content-thin" || issue.id === "meta-description-weak")) {
    status = "partial";
  }

  return {
    ruleId: issue.id,
    status: evidenceMatch ? status : "failed",
    evidenceMatch,
  };
}

export function verifyIssues(issues: AuditIssue[], pages: ExtractedPage[]): AuditIssue[] {
  return issues.map((issue) => {
    const check = verifyRuleEvidence(issue, pages);
    return {
      ...issue,
      verificationStatus: check.evidenceMatch ? (check.status === "verified" ? "verified" : "partial") : "low_confidence",
    };
  });
}

export function getVerificationSummary(issues: AuditIssue[]): VerificationSummary {
  let verified = 0;
  let partial = 0;
  let failed = 0;
  issues.forEach((i) => {
    if (i.verificationStatus === "verified") verified++;
    else if (i.verificationStatus === "partial") partial++;
    else failed++;
  });
  return {
    total: issues.length,
    verified,
    partial,
    failed,
  };
}
