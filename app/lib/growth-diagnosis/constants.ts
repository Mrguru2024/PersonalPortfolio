/**
 * Ascendra Growth Diagnosis Engine — constants.
 * User-facing labels; no internal/technical jargon.
 */

import type { AuditCategoryKey } from "./types";

export const BUSINESS_TYPES: { value: string; label: string }[] = [
  { value: "local_service", label: "Local service business" },
  { value: "skilled_trades", label: "Skilled trades" },
  { value: "consultant", label: "Consultant / Freelancer" },
  { value: "agency", label: "Agency / Studio" },
  { value: "startup_saas", label: "Startup / Early-stage product" },
  { value: "unsure", label: "Not sure" },
];

export const PRIMARY_GOALS: { value: string; label: string }[] = [
  { value: "get_more_leads", label: "Get more leads" },
  { value: "improve_trust", label: "Improve website trust" },
  { value: "increase_bookings", label: "Increase bookings" },
  { value: "improve_local_seo", label: "Improve local visibility" },
  { value: "identify_blockers", label: "Identify growth blockers" },
];

export const CATEGORY_LABELS: Record<AuditCategoryKey, string> = {
  performance: "Performance",
  seo_foundations: "SEO Foundations",
  conversion_readiness: "Conversion Readiness",
  mobile_experience: "Mobile Experience",
  trust_authority: "Trust & Authority",
  content_clarity: "Content Clarity",
  accessibility_basics: "Accessibility Basics",
  local_visibility: "Local Visibility",
};

export const GRADE_TIERS: { min: number; max: number; label: string }[] = [
  { min: 90, max: 100, label: "Strong Growth Position" },
  { min: 75, max: 89, label: "Healthy but Leaking Opportunities" },
  { min: 60, max: 74, label: "Needs Improvement" },
  { min: 40, max: 59, label: "Growth Friction Present" },
  { min: 0, max: 39, label: "Critical Lead Flow Problems" },
];

/** Default weights for category scores (0–1). Configurable by business profile. */
export const DEFAULT_WEIGHTS: Record<AuditCategoryKey, number> = {
  performance: 0.12,
  seo_foundations: 0.14,
  conversion_readiness: 0.18,
  mobile_experience: 0.12,
  trust_authority: 0.15,
  content_clarity: 0.14,
  accessibility_basics: 0.08,
  local_visibility: 0.07,
};

/** Weights for Website Performance Score (technical/usability). */
export const WEBSITE_PERFORMANCE_WEIGHTS: Partial<Record<AuditCategoryKey, number>> = {
  performance: 0.2,
  seo_foundations: 0.2,
  mobile_experience: 0.2,
  accessibility_basics: 0.15,
  conversion_readiness: 0.15,
  content_clarity: 0.1,
};

/** Weights for Startup Website Score (positioning, trust, conversion). */
export const STARTUP_WEBSITE_WEIGHTS: Partial<Record<AuditCategoryKey, number>> = {
  conversion_readiness: 0.25,
  trust_authority: 0.25,
  content_clarity: 0.2,
  seo_foundations: 0.1,
  mobile_experience: 0.1,
  performance: 0.1,
};

/** Business profile type for weight selection. */
export type AuditBusinessProfile = "local_service" | "skilled_trades" | "consultant" | "agency" | "startup_saas" | "unsure";

/** Profile-based weights: local service / skilled trades emphasize conversion, trust, local. */
export const PROFILE_WEIGHTS_LOCAL: Record<AuditCategoryKey, number> = {
  performance: 0.10,
  seo_foundations: 0.12,
  conversion_readiness: 0.20,
  mobile_experience: 0.14,
  trust_authority: 0.18,
  content_clarity: 0.12,
  accessibility_basics: 0.06,
  local_visibility: 0.08,
};

/** Profile-based weights: startup / early SaaS emphasize conversion, trust, content clarity. */
export const PROFILE_WEIGHTS_STARTUP: Record<AuditCategoryKey, number> = {
  performance: 0.10,
  seo_foundations: 0.12,
  conversion_readiness: 0.22,
  mobile_experience: 0.10,
  trust_authority: 0.22,
  content_clarity: 0.18,
  accessibility_basics: 0.04,
  local_visibility: 0.02,
};

/** Default (unsure / generic) weights — same as DEFAULT_WEIGHTS. */
export const PROFILE_WEIGHTS_DEFAULT: Record<AuditCategoryKey, number> = { ...DEFAULT_WEIGHTS };

/** Resolve weights by business profile. */
export function getWeightsForProfile(profile: AuditBusinessProfile | undefined): Record<AuditCategoryKey, number> {
  if (profile === "local_service" || profile === "skilled_trades") return PROFILE_WEIGHTS_LOCAL;
  if (profile === "startup_saas" || profile === "agency") return PROFILE_WEIGHTS_STARTUP;
  return PROFILE_WEIGHTS_DEFAULT;
}

export const CLIENT_FACING_STEP_LABELS: Record<string, string> = {
  pending: "Preparing",
  in_progress: "Scanning site structure",
  crawl: "Reviewing performance signals",
  extract: "Checking trust and conversion elements",
  rules: "Building your diagnosis",
  verify: "Finalizing your score",
  verified: "Complete",
};

/** Accuracy notice copy variants (for A/B or placement). */
export const ACCURACY_NOTICE_VARIANTS: string[] = [
  "This automated diagnosis is built to provide a strong, evidence-based review of your website's performance, clarity, and growth opportunities. For the most complete and in-depth level of accuracy, strategy, and custom recommendations, schedule a human diagnosis with Ascendra.",
  "Your results are based on a structured review of your site. For deeper strategic insight and a custom action plan, we recommend a human diagnosis session with our team.",
  "This tool gives you a clear snapshot of where your site stands. For the highest level of accuracy and tailored next steps, book a human growth diagnosis with Ascendra.",
];
