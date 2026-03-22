/**
 * Conversion funnel CTA copy and paths – used across hero, landing pages, blog, footer.
 * Keeps primary/secondary CTAs consistent site-wide.
 */

/** Free trial: value-first (call + audit); self-serve tools are secondary—not the paid challenge. */
export const FREE_TRIAL_PATH = "/free-trial";

/** Paid 5-day website system challenge (checkout on `/challenge`). */
export const CHALLENGE_LANDING_PATH = "/challenge";

export const PRIMARY_CTA = "Request your Digital Growth Audit";
export const PRIMARY_CTA_SHORT = "Request audit";
export const SECONDARY_CTA = "Book a free call";
export const SEE_GROWTH_SYSTEMS = "See growth systems";
/** Growth diagnosis funnel: multi-step diagnosis → results → apply. */
export const GROWTH_DIAGNOSIS_PATH = "/growth";
/** Automated website growth diagnosis (crawl + score + report). */
export const GROWTH_DIAGNOSIS_ENGINE_PATH = "/growth-diagnosis";
/** Full project growth assessment (wizard → results / proposal). Not the same as `/growth` (free diagnosis entry). */
export const PROJECT_GROWTH_ASSESSMENT_PATH = "/assessment";

/** Persona-based journey selector + tailored paths (`?journey=`). */
export const PERSONA_JOURNEY_PATH = "/journey";

/** Single landing: pick automated scan vs questionnaire vs full paid assessment. */
export const DIAGNOSTICS_HUB_PATH = "/diagnostics";

/** Canonical lead magnet: Digital Growth Audit. */
export const AUDIT_PATH = "/digital-growth-audit";
export const DIGITAL_GROWTH_AUDIT_PATH = "/digital-growth-audit";
export const REVENUE_CALCULATOR_PATH = "/website-revenue-calculator";
export const WEBSITE_SCORE_PATH = "/website-performance-score";
export const BOOK_CALL_HREF = "/strategy-call";

/** Ecosystem funnel (Brand Growth hub + paths) — Ascendra + Macon Designs + Style Studio */
export const BRAND_GROWTH_PATH = "/brand-growth";
export const STRATEGY_CALL_PATH = "/strategy-call";
export const CALL_CONFIRMATION_PATH = "/call-confirmation";
export const LAUNCH_YOUR_BRAND_PATH = "/launch-your-brand";
export const REBRAND_YOUR_BUSINESS_PATH = "/rebrand-your-business";
export const MARKETING_ASSETS_PATH = "/marketing-assets";

export const ECOSYSTEM_CTA_HUB = "See growth systems";
export const ECOSYSTEM_CTA_STRATEGY_CALL = "Book a free call";
export const ECOSYSTEM_CTA_LAUNCH = "Book a brand launch call";
export const ECOSYSTEM_CTA_REBRAND = "Book a rebrand call";
export const ECOSYSTEM_CTA_MARKETING = "Upgrade your marketing";

/** Lead magnet hub and tools */
export const FREE_GROWTH_TOOLS_PATH = "/free-growth-tools";
export const COMPETITOR_SNAPSHOT_PATH = "/competitor-position-snapshot";
export const HOMEPAGE_BLUEPRINT_PATH = "/homepage-conversion-blueprint";

/**
 * Canonical order for **free** lead entry points (Ascendra GTM priority).
 * 1 Free trial (value-first) · 2 Audit · 3 Diagnosis · 4 Toolkit.
 */
export const FREE_LEAD_OFFERS_IN_ORDER = [
  {
    rank: 1,
    id: "free_trial",
    label: "Free trial",
    shortLabel: "Free trial",
    href: FREE_TRIAL_PATH,
    description:
      "Test run of our real offer: strategy call and human audit first—feel the gap without the full system; tools are optional after.",
  },
  {
    rank: 2,
    id: "free_audit",
    label: "Free audit",
    shortLabel: "Audit",
    href: DIGITAL_GROWTH_AUDIT_PATH,
    description: "Tailored review of brand clarity, trust, and conversion on your site.",
  },
  {
    rank: 3,
    id: "free_diagnosis",
    label: "Free diagnosis",
    shortLabel: "Diagnosis",
    href: GROWTH_DIAGNOSIS_ENGINE_PATH,
    description: "Automated scan and growth readiness score when you want machine benchmarks after the human story.",
  },
  {
    rank: 4,
    id: "free_toolkit",
    label: "Free toolkit",
    shortLabel: "Toolkit",
    href: FREE_GROWTH_TOOLS_PATH,
    description: "Calculators, blueprints, snapshots, and more in one place.",
  },
] as const;

export type FreeLeadOfferId = (typeof FREE_LEAD_OFFERS_IN_ORDER)[number]["id"];

/** Primary free CTA for global promos (matches free lead #1). */
export const PRIMARY_FREE_LEAD_CTA = "Start your free trial";
export const PRIMARY_FREE_LEAD_SHORT = "Free trial";
export const PRIMARY_FREE_LEAD_PATH = FREE_TRIAL_PATH;

/** Startup founder funnel */
export const STARTUP_GROWTH_KIT_PATH = "/resources/startup-growth-kit";
export const STARTUP_WEBSITE_SCORE_PATH = "/tools/startup-website-score";
export const STARTUP_ACTION_PLAN_PATH = "/resources/startup-action-plan";
export const STARTUP_GROWTH_SYSTEM_OFFER_PATH = "/offers/startup-growth-system";
