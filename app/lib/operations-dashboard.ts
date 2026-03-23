export interface OperationsDocumentRecord {
  id: number;
  title: string;
  contentType: string;
  workflowStatus: string;
  visibility: string;
  slug: string | null;
  excerpt: string | null;
  bodyHtml: string | null;
  bodyMarkdown: string | null;
  tags?: unknown;
  categories?: unknown;
  personaTags?: unknown;
  updatedAt?: string | Date | null;
}

export interface ContentReadinessResult {
  completionScore: number;
  missingElements: string[];
  seoReady: boolean;
  checks: {
    hasHeadline: boolean;
    hasResults: boolean;
    hasVisuals: boolean;
    hasCta: boolean;
    hasSeo: boolean;
  };
}

const CASE_STUDY_PATTERN =
  /(case[\s-]?study|client result|client story|success story|proof asset|before and after|results breakdown|customer story)/i;
const RESULTS_PATTERN =
  /(result|outcome|growth|revenue|conversion|roi|booked|pipeline|qualified lead|lead volume|wins?)/i;
const CTA_PATTERN =
  /(book|schedule|contact|start now|get started|request|apply|talk to|work with|next step|strategy call)/i;
const IMAGE_HTML_PATTERN = /<img[\s>]|<figure[\s>]/i;
const IMAGE_MD_PATTERN = /!\[[^\]]*]\([^)]+\)/i;

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function stripHtml(input: string): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchBlob(doc: OperationsDocumentRecord): string {
  return [
    doc.title,
    doc.contentType,
    doc.excerpt ?? "",
    doc.bodyMarkdown ?? "",
    stripHtml(doc.bodyHtml ?? ""),
    ...toStringArray(doc.tags),
    ...toStringArray(doc.categories),
    ...toStringArray(doc.personaTags),
  ]
    .join(" ")
    .toLowerCase();
}

export function isCaseStudyDocument(doc: OperationsDocumentRecord): boolean {
  const blob = buildSearchBlob(doc);
  return CASE_STUDY_PATTERN.test(blob);
}

export function evaluateContentReadiness(doc: OperationsDocumentRecord): ContentReadinessResult {
  const bodyText = buildSearchBlob(doc);
  const title = doc.title?.trim() ?? "";
  const excerpt = doc.excerpt?.trim() ?? "";
  const slug = doc.slug?.trim() ?? "";

  const hasHeadline = title.length >= 12;
  const hasResults = RESULTS_PATTERN.test(bodyText);
  const hasVisuals =
    IMAGE_HTML_PATTERN.test(doc.bodyHtml ?? "") ||
    IMAGE_MD_PATTERN.test(doc.bodyMarkdown ?? "") ||
    /\b(screenshot|chart|graph|visual|image|before|after)\b/i.test(bodyText);
  const hasCta = CTA_PATTERN.test(bodyText);
  const hasSeo = slug.length > 0 && excerpt.length >= 40;

  const checks = { hasHeadline, hasResults, hasVisuals, hasCta, hasSeo };
  const passedCount = Object.values(checks).filter(Boolean).length;
  const completionScore = Math.round((passedCount / 5) * 100);

  const missingElements: string[] = [];
  if (!hasHeadline) missingElements.push("Missing headline");
  if (!hasResults) missingElements.push("Missing results");
  if (!hasVisuals) missingElements.push("Missing visuals");
  if (!hasCta) missingElements.push("Missing CTA");
  if (!hasSeo) missingElements.push("Missing SEO");

  return {
    completionScore,
    missingElements,
    seoReady: hasSeo,
    checks,
  };
}

export function deriveRevenueOpportunity(score: number | null | undefined): "High" | "Medium" | "Low" | "Unknown" {
  if (score == null || Number.isNaN(score)) return "Unknown";
  if (score < 55) return "High";
  if (score < 75) return "Medium";
  return "Low";
}

interface RecommendedSystemInput {
  primaryGoal?: string | null;
  businessType?: string | null;
  topBlockerTitle?: string | null;
}

export function deriveRecommendedSystem({
  primaryGoal,
  businessType,
  topBlockerTitle,
}: RecommendedSystemInput): string {
  const goal = (primaryGoal ?? "").toLowerCase();
  const blocker = (topBlockerTitle ?? "").toLowerCase();
  const business = (businessType ?? "").toLowerCase();

  if (goal === "get_more_leads") return "Lead Capture + Follow-Up System";
  if (goal === "increase_bookings") return "Booking Conversion System";
  if (goal === "improve_trust") return "Trust + Proof System";
  if (goal === "improve_local_seo") return "Local Visibility System";

  if (blocker.includes("cta") || blocker.includes("conversion")) {
    return "Offer + Conversion System";
  }
  if (blocker.includes("trust") || blocker.includes("testimonial")) {
    return "Proof + Authority System";
  }
  if (blocker.includes("seo") || blocker.includes("meta")) {
    return "SEO Foundation System";
  }
  if (business.includes("local") || business.includes("trades")) {
    return "Local Lead Engine";
  }

  return "Revenue Opportunity Diagnostic System";
}
