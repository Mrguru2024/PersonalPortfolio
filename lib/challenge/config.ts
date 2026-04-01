/**
 * Paid challenge funnel config: pricing, order bump, lesson titles, CTAs.
 * Data-driven so pricing and copy can be adjusted without code changes.
 */

export const CHALLENGE_NAME = "Build Your Client-Generating Website System";
export const CHALLENGE_SUBTITLE = "5-Day Paid Challenge";

/** Default entry price in cents. Tune via env/CMS later if needed. */
export const CHALLENGE_PRICE_CENTS = 4700; // $47
export const CHALLENGE_PRICE_DISPLAY = "$47";

export const ORDER_BUMP = {
  enabled: true,
  title: "Ascendra Growth Toolkit",
  description: "Website structure blueprint, lead capture templates, funnel flow map, CRM setup checklist.",
  priceCents: 0, // optional add-on price; 0 = free add-on
  priceDisplay: "Free with challenge",
} as const;

export const LESSON_DAYS = [
  { day: 1, title: "Why Most Websites Fail to Generate Leads" },
  { day: 2, title: "The 5-Second Clarity Rule" },
  { day: 3, title: "Lead Capture Systems That Convert" },
  { day: 4, title: "Content That Attracts Buyers" },
  { day: 5, title: "Your Client-Generating Website Plan" },
] as const;

/** CTA at end of challenge: apply for strategy call / implementation. */
export const CHALLENGE_APPLY_CTA = {
  label: "Apply for a Strategy Call",
  href: "/challenge/apply",
  secondaryLabel: "Get Ascendra to Build This With You",
  strategyCallPath: "/strategy-call",
} as const;
