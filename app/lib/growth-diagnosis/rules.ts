/**
 * Ascendra Growth Diagnosis Engine — deterministic rule checks.
 * All checks are evidence-based; results feed verification and scoring.
 */

import type { ExtractedPage, AuditIssue, AuditCategoryKey, Severity, FindingClassification } from "./types";
import { CATEGORY_LABELS } from "./constants";

export interface RuleResult {
  ruleId: string;
  category: AuditCategoryKey;
  severity: Severity;
  classification: FindingClassification;
  title: string;
  description: string;
  evidence: string;
  impact: string;
  recommendation: string;
  passed: boolean;
  pageUrl?: string;
}

function issueFromRule(
  r: RuleResult,
  confidence: "high" | "medium" | "low"
): AuditIssue {
  return {
    id: r.ruleId,
    category: r.category,
    severity: r.severity,
    classification: r.classification,
    title: r.title,
    description: r.description,
    evidence: r.evidence,
    impact: r.impact,
    recommendation: r.recommendation,
    confidenceLevel: confidence,
    pageUrl: r.pageUrl,
    verificationStatus: "pending",
  };
}

function getOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

export function runRules(pages: ExtractedPage[]): RuleResult[] {
  const results: RuleResult[] = [];
  if (pages.length === 0) return results;
  const origin = getOrigin(pages[0].url);
  const home = pages.find((p) => getOrigin(p.url) === origin && (new URL(p.url).pathname === "/" || new URL(p.url).pathname === ""));
  const primary = home || pages[0];

  for (const page of pages) {
    const u = page.url;

    if (!page.title || page.title.length < 10) {
      results.push({
        ruleId: "title-missing-weak",
        category: "seo_foundations",
        severity: "high",
        classification: "confirmed_issue",
        title: "Missing or weak page title",
        description: "This page has no title or a very short one. Titles help search engines and visitors understand your content.",
        evidence: `Title: "${page.title || "empty"}"`,
        impact: "Harder for search engines and visitors to understand what this page is about.",
        recommendation: "Add a clear, descriptive title (around 50–60 characters) that includes your main topic or offer.",
        passed: false,
        pageUrl: u,
      });
    }

    if (!page.metaDescription || page.metaDescription.length < 30) {
      results.push({
        ruleId: "meta-description-weak",
        category: "seo_foundations",
        severity: "medium",
        classification: "improvement_opportunity",
        title: "Missing or weak meta description",
        description: "This page has no meta description or one that is too short to be useful in search results.",
        evidence: `Meta description: ${page.metaDescription ? `"${page.metaDescription.slice(0, 80)}..."` : "none"}`,
        impact: "Search engines may show a generic snippet instead of a compelling summary, which can reduce clicks.",
        recommendation: "Add a meta description of about 150–160 characters that summarizes the page and encourages clicks.",
        passed: false,
        pageUrl: u,
      });
    }

    if (page.h1Count === 0) {
      results.push({
        ruleId: "h1-missing",
        category: "seo_foundations",
        severity: "high",
        classification: "confirmed_issue",
        title: "No main heading (H1) found",
        description: "This page has no H1 heading. A single clear H1 helps both visitors and search engines understand the page topic.",
        evidence: "H1 count: 0",
        impact: "Weaker clarity for visitors and search engines.",
        recommendation: "Add one clear H1 at the top of the main content that describes the page.",
        passed: false,
        pageUrl: u,
      });
    } else if (page.h1Count > 1) {
      results.push({
        ruleId: "h1-multiple",
        category: "seo_foundations",
        severity: "medium",
        classification: "improvement_opportunity",
        title: "Multiple H1 headings",
        description: "This page has more than one H1. A single main heading is usually clearer for structure and SEO.",
        evidence: `H1 count: ${page.h1Count}`,
        impact: "Search engines and assistive tech may have trouble identifying the main topic.",
        recommendation: "Use one H1 for the main topic and use H2/H3 for sections.",
        passed: false,
        pageUrl: u,
      });
    }

    if (page === primary) {
      if (page.ctaButtons.length === 0) {
        results.push({
          ruleId: "cta-missing",
          category: "conversion_readiness",
          severity: "high",
          classification: "confirmed_issue",
          title: "No clear call to action",
          description: "We didn't find a clear button or link that tells visitors what to do next (e.g. Book a call, Get a quote).",
          evidence: "No CTA-like buttons or links detected.",
          impact: "Visitors may leave without taking the next step.",
          recommendation: "Add a high-visibility primary CTA above the fold and repeat it in key sections.",
          passed: false,
          pageUrl: u,
        });
      } else if (page.ctaButtons.length === 1 && page.ctaButtons[0].text.length < 3) {
        results.push({
          ruleId: "cta-weak",
          category: "conversion_readiness",
          severity: "medium",
          classification: "improvement_opportunity",
          title: "Call to action may be hard to find or unclear",
          description: "The main action is not obvious or is too generic.",
          evidence: `CTA text: "${page.ctaButtons[0].text}"`,
          impact: "Some visitors may not know what to do next.",
          recommendation: "Use a specific, action-oriented CTA (e.g. 'Book a free call' or 'Get your quote') and keep it visible.",
          passed: false,
          pageUrl: u,
        });
      }
    }

    if (!page.hasForm && (u.includes("contact") || u.includes("quote") || u.includes("book"))) {
      results.push({
        ruleId: "form-missing-contact",
        category: "conversion_readiness",
        severity: "high",
        classification: "confirmed_issue",
        title: "No form on this page",
        description: "This looks like a contact or booking page but we didn't find a form.",
        evidence: "No form element found.",
        impact: "Visitors cannot easily submit an inquiry from this page.",
        recommendation: "Add a simple form (name, email, message or booking fields) so visitors can take the next step.",
        passed: false,
        pageUrl: u,
      });
    }

    if (page.trustSignals.length === 0 && page === primary) {
      results.push({
        ruleId: "trust-signals-missing",
        category: "trust_authority",
        severity: "medium",
        classification: "improvement_opportunity",
        title: "No obvious trust elements",
        description: "We didn't find clear trust signals (e.g. testimonials, reviews, credentials) on the main page.",
        evidence: "No testimonial/review/trust sections detected.",
        impact: "New visitors may be less likely to convert without social proof.",
        recommendation: "Add a short testimonial, review, or credentials section above the fold or near the CTA.",
        passed: false,
        pageUrl: u,
      });
    }

    if (page.paragraphCount > 0 && page.wordCount < 150 && (page === primary || u.includes("service"))) {
      results.push({
        ruleId: "content-thin",
        category: "content_clarity",
        severity: "medium",
        classification: "improvement_opportunity",
        title: "Very little content on this page",
        description: "This page has very little text. More helpful content can improve clarity and SEO.",
        evidence: `About ${page.wordCount} words on this page.`,
        impact: "Visitors and search engines have little to go on to understand your offer.",
        recommendation: "Add a few short paragraphs that explain what you offer, who it's for, and why they should choose you.",
        passed: false,
        pageUrl: u,
      });
    }

    if (!page.viewportMeta) {
      results.push({
        ruleId: "viewport-missing",
        category: "mobile_experience",
        severity: "high",
        classification: "confirmed_issue",
        title: "No viewport meta tag",
        description: "This page doesn't set a viewport, which can make it display poorly on mobile devices.",
        evidence: "No viewport meta tag found.",
        impact: "Mobile visitors may see a zoomed-out or hard-to-use layout.",
        recommendation: "Add a viewport meta tag so the site adapts to different screen sizes.",
        passed: false,
        pageUrl: u,
      });
    }

    if (page.imageCount > 0 && page.imagesWithAlt < page.imageCount) {
      results.push({
        ruleId: "images-alt-missing",
        category: "accessibility_basics",
        severity: "medium",
        classification: "improvement_opportunity",
        title: "Some images missing alt text",
        description: "Not all images have descriptive alt text, which helps accessibility and SEO.",
        evidence: `${page.imagesWithAlt} of ${page.imageCount} images have alt text.`,
        impact: "Screen reader users and search engines get less context from images.",
        recommendation: "Add short, descriptive alt text to every meaningful image.",
        passed: false,
        pageUrl: u,
      });
    }

    if (!page.hasSchema && page === primary) {
      results.push({
        ruleId: "schema-missing",
        category: "seo_foundations",
        severity: "low",
        classification: "improvement_opportunity",
        title: "No structured data (schema) found",
        description: "We didn't find schema markup that helps search engines understand your business or content.",
        evidence: "No JSON-LD or similar structured data detected.",
        impact: "You may miss out on rich results in search (e.g. business info, reviews).",
        recommendation: "Consider adding LocalBusiness or Organization schema, and article schema where relevant.",
        passed: false,
        pageUrl: u,
      });
    }

    if (page === primary && !page.hasPhoneLink) {
      results.push({
        ruleId: "phone-not-clickable",
        category: "conversion_readiness",
        severity: "medium",
        classification: "improvement_opportunity",
        title: "No click-to-call phone link",
        description: "We didn't find a tap-to-call phone link, which is especially important on mobile.",
        evidence: "No tel: link found.",
        impact: "Mobile visitors may have to copy the number instead of calling with one tap.",
        recommendation: "Use a tel: link for your main phone number so mobile users can tap to call.",
        passed: false,
        pageUrl: u,
      });
    }

    if (page.internalLinks < 3 && pages.length > 1) {
      results.push({
        ruleId: "internal-links-weak",
        category: "seo_foundations",
        severity: "low",
        classification: "improvement_opportunity",
        title: "Few internal links",
        description: "This page has few links to other pages on your site.",
        evidence: `${page.internalLinks} internal links found.`,
        impact: "Visitors and search engines may not discover your other key pages easily.",
        recommendation: "Link to your main service, contact, or booking pages from this page.",
        passed: false,
        pageUrl: u,
      });
    }
  }

  return results;
}

export function rulesToIssues(ruleResults: RuleResult[]): AuditIssue[] {
  return ruleResults.filter((r) => !r.passed).map((r) => issueFromRule(r, "high"));
}
