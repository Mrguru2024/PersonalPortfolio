/**
 * Placement options for funnel content assets.
 * Admin selects pagePath + sectionId when publishing content to lead magnets.
 */

export const CONTENT_PLACEMENT_PAGES = [
  { path: "/digital-growth-audit", label: "Digital Growth Audit" },
  { path: "/free-growth-tools", label: "Free Growth Tools" },
  { path: "/growth", label: "Growth (Diagnosis entry)" },
  { path: "/growth-diagnosis", label: "Website Growth Diagnosis" },
  { path: "/free-trial", label: "Free trial" },
  { path: "/resources/startup-growth-kit", label: "Startup Growth Kit" },
  { path: "/resources/startup-action-plan", label: "Startup Action Plan" },
  { path: "/tools/startup-website-score", label: "Startup Website Score" },
  { path: "/offers/startup-growth-system", label: "Startup Growth System Offer" },
  { path: "/website-revenue-calculator", label: "Revenue Calculator" },
  { path: "/competitor-position-snapshot", label: "Competitor Snapshot" },
  { path: "/homepage-conversion-blueprint", label: "Homepage Blueprint" },
  { path: "/website-performance-score", label: "Website Performance Score" },
  { path: "/brand-growth", label: "Brand Growth" },
  { path: "/strategy-call", label: "Strategy Call" },
  { path: "/", label: "Homepage" },
] as const;

export const CONTENT_PLACEMENT_SECTIONS = [
  { id: "hero", label: "Hero (below headline)" },
  { id: "lead_magnet_download", label: "Lead magnet / download area" },
  { id: "after_form", label: "After form / thank you" },
  { id: "sidebar", label: "Sidebar" },
  { id: "resources", label: "Resources / tools list" },
  { id: "before_cta", label: "Before primary CTA" },
  { id: "footer_section", label: "Footer of page section" },
] as const;

export type PlacementPagePath = (typeof CONTENT_PLACEMENT_PAGES)[number]["path"];
export type PlacementSectionId = (typeof CONTENT_PLACEMENT_SECTIONS)[number]["id"];

export const LEAD_MAGNET_SLUGS = [
  { slug: "digital-growth-audit", label: "Digital Growth Audit" },
  { slug: "free-growth-tools", label: "Free Growth Tools hub" },
  { slug: "startup-growth-kit", label: "Startup Growth Kit" },
  { slug: "startup-website-score", label: "Startup Website Score" },
  { slug: "startup-action-plan", label: "Startup Action Plan" },
  { slug: "startup-growth-system", label: "Startup Growth System Offer" },
  { slug: "revenue-calculator", label: "Revenue Calculator" },
  { slug: "competitor-snapshot", label: "Competitor Snapshot" },
  { slug: "homepage-blueprint", label: "Homepage Blueprint" },
  { slug: "website-performance-score", label: "Website Performance Score" },
  { slug: "growth-diagnosis", label: "Website Growth Diagnosis" },
] as const;
