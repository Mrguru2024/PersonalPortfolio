/**
 * Authority content for the lead-gen funnel: lead magnet mapping and website breakdowns.
 * Long-form articles live in the blog (blogSeedData); this file keeps lead-magnet maps and breakdowns.
 */

import {
  AUDIT_PATH,
  REVENUE_CALCULATOR_PATH,
  WEBSITE_SCORE_PATH,
  COMPETITOR_SNAPSHOT_PATH,
  HOMEPAGE_BLUEPRINT_PATH,
} from "./funnelCtas";

/** Categories for /insights hub */
export const INSIGHT_CATEGORIES = [
  { slug: "website-conversion", label: "Website Conversion" },
  { slug: "brand-positioning", label: "Brand Positioning" },
  { slug: "design-experience", label: "Design Experience" },
  { slug: "digital-growth-strategy", label: "Digital Growth Strategy" },
  { slug: "case-studies", label: "Case Studies" },
] as const;

export type InsightCategorySlug = (typeof INSIGHT_CATEGORIES)[number]["slug"];

/** Lead magnet slug for mapping content → tool */
export type LeadMagnetSlug =
  | "digital-growth-audit"
  | "revenue-calculator"
  | "website-performance-score"
  | "competitor-snapshot"
  | "homepage-blueprint";

export const LEAD_MAGNET_BY_SLUG: Record<
  LeadMagnetSlug,
  { label: string; href: string; cta: string }
> = {
  "digital-growth-audit": {
    label: "Digital Growth Audit",
    href: AUDIT_PATH,
    cta: "Request Your Digital Growth Audit",
  },
  "revenue-calculator": {
    label: "Website Revenue Loss Calculator",
    href: REVENUE_CALCULATOR_PATH,
    cta: "Use the Revenue Calculator",
  },
  "website-performance-score": {
    label: "Website Performance Score",
    href: WEBSITE_SCORE_PATH,
    cta: "Get Your Performance Score",
  },
  "competitor-snapshot": {
    label: "Competitor Position Snapshot",
    href: COMPETITOR_SNAPSHOT_PATH,
    cta: "Request Competitor Snapshot",
  },
  "homepage-blueprint": {
    label: "Homepage Conversion Blueprint",
    href: HOMEPAGE_BLUEPRINT_PATH,
    cta: "View the Blueprint",
  },
};

export interface InsightArticle {
  slug: string;
  title: string;
  description: string;
  category: InsightCategorySlug;
  publishedAt: string; // ISO date
  /** Short subhead or key takeaway */
  subhead?: string;
  /** Lead magnet to suggest at end; audit is always secondary */
  leadMagnetSlug: LeadMagnetSlug;
  /** Optional second CTA (always audit) */
  secondaryCtaSlug?: "digital-growth-audit";
  /** Body sections for scannable layout */
  sections: Array<{
    heading: string;
    body: string;
    highlight?: string;
  }>;
  /** Quick Self-Check bullets shown before CTA */
  quickSelfCheck?: string[];
}

export interface WebsiteBreakdown {
  slug: string;
  title: string;
  /** Business name or type (e.g. "Local HVAC Company") */
  businessContext: string;
  publishedAt: string;
  /** Sections for consistent structure */
  whatWorksWell: string[];
  whatCouldBeImproved: string[];
  conversionOpportunities: string[];
  quickFixSuggestions: string[];
  /** 1–2 sentence context */
  contextSummary?: string;
}

// ——— Website breakdowns ———

export const WEBSITE_BREAKDOWNS: WebsiteBreakdown[] = [
  {
    slug: "local-service-business-homepage",
    title: "Local service business homepage",
    businessContext: "A regional HVAC and plumbing company with strong reviews but a generic website.",
    publishedAt: "2025-02-12",
    contextSummary:
      "The business has been in operation for over a decade and gets most of its work from word of mouth. The site is used mainly for credibility checks and contact.",
    whatWorksWell: [
      "Phone number and contact form are visible in the header.",
      "Service area is stated clearly.",
      "Reviews and credentials are present, though buried.",
    ],
    whatCouldBeImproved: [
      "Headline is generic ('Quality Service You Can Trust') and doesn't state who they serve or what they're best at.",
      "No single primary CTA—multiple buttons compete for attention.",
      "Trust signals (licenses, reviews) appear far down the page.",
      "Mobile experience feels cramped; key actions are small.",
    ],
    conversionOpportunities: [
      "Lead with a clear promise for the target customer (e.g. homeowners in [City] who need fast, reliable HVAC and plumbing).",
      "Move one primary CTA above the fold: e.g. 'Request a Free Estimate' or 'Schedule Service.'",
      "Add a short 'Why choose us' or proof section near the top.",
      "Simplify the menu so 'Services' and 'Contact' are obvious.",
    ],
    quickFixSuggestions: [
      "Rewrite the hero headline to be specific: who, what, where.",
      "Make the primary CTA one button and repeat it once per section.",
      "Move 2–3 trust elements (reviews, licenses) above the fold.",
      "Test the contact form on mobile; ensure tap targets are large enough.",
    ],
  },
  {
    slug: "professional-services-firm",
    title: "Professional services firm",
    businessContext: "A small law firm focusing on family law. The site looks professional but doesn't differentiate.",
    publishedAt: "2025-02-01",
    contextSummary:
      "The firm serves one metro area and wants to attract clients who are a good fit for their approach. The website is used for research before first contact.",
    whatWorksWell: [
      "Clean, readable design that feels appropriate for the industry.",
      "Attorney bios and credentials are present.",
      "Practice areas are listed.",
    ],
    whatCouldBeImproved: [
      "Messaging could apply to any family law firm—no clear differentiator.",
      "No clear path from 'I'm considering help' to 'I want to talk to someone.'",
      "Blog or resources section exists but isn't tied to a lead magnet or next step.",
      "Above-the-fold doesn't state who they serve (e.g. clients in [City] going through divorce or custody).",
    ],
    conversionOpportunities: [
      "Add a single primary CTA: e.g. 'Schedule a Consultation' or 'Request a Case Review.'",
      "Position the firm clearly: e.g. 'Family law for [City]—divorce, custody, and support.'",
      "Add a short 'What to expect' or process section to reduce uncertainty.",
      "Link insights or blog posts to a consultation or contact CTA.",
    ],
    quickFixSuggestions: [
      "Rewrite the main headline to include who they serve and one key outcome.",
      "Add one prominent CTA button and repeat it in the footer.",
      "Add a 2–3 sentence 'Why us' or approach section near the top.",
      "Ensure the contact form is easy to find on mobile.",
    ],
  },
];

// ——— Helpers ———

export function getBreakdownBySlug(slug: string): WebsiteBreakdown | undefined {
  return WEBSITE_BREAKDOWNS.find((b) => b.slug === slug);
}

export function getAllBreakdowns(): WebsiteBreakdown[] {
  return [...WEBSITE_BREAKDOWNS].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
