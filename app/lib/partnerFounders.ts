/**
 * Partner Founder Signal: founders and their insights for authority/trust.
 * Maps to lead magnets and supports PartnerInsight components across the funnel.
 */

import {
  AUDIT_PATH,
  REVENUE_CALCULATOR_PATH,
  WEBSITE_SCORE_PATH,
  COMPETITOR_SNAPSHOT_PATH,
  HOMEPAGE_BLUEPRINT_PATH,
} from "./funnelCtas";

export type FounderSlug = "anthony-feaster" | "denishia" | "kristopher-williams";

export interface FounderProfile {
  slug: FounderSlug;
  name: string;
  company: string;
  companyHref: string;
  /** Short tagline for cards */
  tagline: string;
  focus: string[];
  /** Role in the ecosystem (strategy / design / technology) */
  discipline: "strategy" | "design" | "technology";
  /** Optional image URL; fallback to company logo or initials */
  image?: string;
  /** Alt for image */
  imageAlt?: string;
  /** Use company logo instead of photo when true */
  useLogo?: boolean;
  /** Intro for About page / team section */
  intro: string;
  /** How they contribute to the ecosystem */
  roleInEcosystem: string;
  /** One sentence perspective on helping businesses */
  perspective: string;
  /** Optional portfolio/work URL (e.g. Behance, Dribbble) */
  portfolioUrl?: string;
  /** Optional logo URL for dark theme (e.g. white logo); when set, light theme uses image/logo above */
  logoDark?: string;
}

export interface PartnerInsightItem {
  id: string;
  founderSlug: FounderSlug;
  headline: string;
  paragraph: string;
  ctaLabel: string;
  ctaHref: string;
}

// ——— Founder profiles ———

const ASCENDRA_LOGO = "/ascendra-logo.svg";
const MACON_LOGO = "/Ascendra images/logomacondesigns/Macon Designs_Logo_Tagline_Badge.png";
const STYLE_STUDIO_LOGO_LIGHT = "/Ascendra images/Stylestudiologos/StyleStudio_Blk_Rd_.png";
const STYLE_STUDIO_LOGO_DARK = "/Ascendra images/Stylestudiologos/StyleStudio_Wt_Rd_.png";

export const FOUNDERS: FounderProfile[] = [
  {
    slug: "anthony-feaster",
    name: "Anthony Feaster",
    company: "Ascendra Technologies",
    companyHref: "/partners/ascendra-technologies",
    tagline: "Web development, funnel systems, conversion strategy",
    discipline: "technology",
    focus: [
      "Web development",
      "Funnel systems",
      "Automation",
      "Conversion strategy",
      "Digital infrastructure",
    ],
    image: "https://github.com/Mrguru2024.png",
    imageAlt: "Anthony Feaster",
    useLogo: false,
    intro:
      "Anthony leads Ascendra Technologies with a focus on making technology serve growth: conversion-focused websites, funnel systems, and automation that turn traffic into leads.",
    roleInEcosystem:
      "Builds and optimizes the digital systems—websites, landing pages, and automation—that capture leads and support business operations.",
    perspective:
      "Most businesses already have traffic. The gap is usually clarity and conversion: a clear offer, a simple path, and a site that loads fast and works on every device.",
  },
  {
    slug: "denishia",
    name: "Denishia",
    company: "Macon Designs®",
    companyHref: "/partners/macon-designs",
    tagline: "Graphic design, brand visuals, creative direction",
    discipline: "design",
    focus: [
      "Graphic design",
      "Brand visuals",
      "User presentation",
      "Visual storytelling",
      "Creative direction",
    ],
    image: undefined,
    imageAlt: "Macon Designs",
    useLogo: true,
    intro:
      "Denishia leads Macon Designs with a BA in Visual Communications and 10+ years in brand identity. She helps businesses look established, intentional, and trustworthy.",
    roleInEcosystem:
      "Owns the visual experience—identity systems, brand guidelines, and design that builds trust and supports the message.",
    perspective:
      "Design isn't decoration. It's how you're perceived. When your visuals are consistent and professional, visitors are more likely to trust you and take the next step.",
    portfolioUrl: "https://www.behance.net/macondesigns",
  },
  {
    slug: "kristopher-williams",
    name: "Kristopher Williams",
    company: "Style Studio Branding",
    companyHref: "/partners/style-studio-branding",
    tagline: "Brand strategy, messaging clarity, positioning",
    discipline: "strategy",
    focus: [
      "Brand strategy",
      "Messaging clarity",
      "Positioning",
      "Identity development",
      "Brand communication",
    ],
    image: undefined,
    imageAlt: "Style Studio Branding",
    useLogo: true,
    intro:
      "Kristopher leads Style Studio Branding with 12+ years in production design and brand work. He focuses on positioning and messaging so businesses are understood quickly.",
    roleInEcosystem:
      "Clarifies positioning and messaging so the market immediately gets what you do, who it's for, and why it matters.",
    perspective:
      "When your message sounds like everyone else's, you blend in. Clarity and specificity build trust and help the right clients choose you.",
    portfolioUrl: "https://www.behance.net/kwilliams7",
    logoDark: STYLE_STUDIO_LOGO_DARK,
  },
];

// ——— Lead magnet mapping by partner focal strengths ———
// Anthony (Technology): conversion, revenue, funnels, digital infrastructure
//   → Revenue Loss Calculator, Digital Growth Audit only.
// Denishia (Design): visual presentation, brand visuals, creative direction
//   → Homepage Conversion Blueprint, Website Performance Score only.
// Kristopher (Strategy): brand strategy, messaging clarity, positioning
//   → Competitor Position Snapshot, Digital Growth Audit only (audit includes brand clarity review).

export const PARTNER_INSIGHTS: PartnerInsightItem[] = [
  // Anthony — conversion, revenue, funnels (tech/conversion focus)
  {
    id: "anthony-convert",
    founderSlug: "anthony-feaster",
    headline: "Why most websites fail to convert",
    paragraph:
      "Traffic alone doesn't grow your business. If the path from visitor to lead is unclear, or the site is slow and cluttered, people leave. The fix is usually simpler than you think: one clear CTA, less friction, and a structure that guides people to the next step.",
    ctaLabel: "Request Digital Growth Audit",
    ctaHref: AUDIT_PATH,
  },
  {
    id: "anthony-revenue",
    founderSlug: "anthony-feaster",
    headline: "How websites leave revenue on the table",
    paragraph:
      "Small changes in conversion rate can mean a big difference in revenue. Many sites get decent traffic but have no clear offer, weak CTAs, or a confusing flow. Estimating the gap helps prioritize what to fix first.",
    ctaLabel: "Use the Revenue Calculator",
    ctaHref: REVENUE_CALCULATOR_PATH,
  },
  {
    id: "anthony-funnels",
    founderSlug: "anthony-feaster",
    headline: "The importance of clear funnels",
    paragraph:
      "A funnel is just a path from stranger to customer. When that path is obvious—hero message, trust, one primary action—you convert more of the traffic you already have. Clarity beats complexity.",
    ctaLabel: "Request Digital Growth Audit",
    ctaHref: AUDIT_PATH,
  },
  // Denishia — visual trust, design, presentation (design focus)
  {
    id: "denishia-trust",
    founderSlug: "denishia",
    headline: "Why visual presentation builds trust",
    paragraph:
      "Visitors decide in seconds whether you look credible. Inconsistent or dated design undermines that. When your visuals are cohesive and professional, people are more likely to stay and take the next step.",
    ctaLabel: "View the Homepage Blueprint",
    ctaHref: HOMEPAGE_BLUEPRINT_PATH,
  },
  {
    id: "denishia-perception",
    founderSlug: "denishia",
    headline: "How design influences perception",
    paragraph:
      "Design isn't just how something looks—it signals how serious you are about your business. Clean hierarchy, consistent branding, and intentional layout tell visitors you're established and worth their time.",
    ctaLabel: "Get Your Performance Score",
    ctaHref: WEBSITE_SCORE_PATH,
  },
  {
    id: "denishia-mistakes",
    founderSlug: "denishia",
    headline: "Common visual mistakes on business websites",
    paragraph:
      "Too many typefaces, cluttered hero sections, and weak visual hierarchy make sites feel amateur. Simplifying and aligning design with your message usually improves both trust and conversion.",
    ctaLabel: "View the Homepage Blueprint",
    ctaHref: HOMEPAGE_BLUEPRINT_PATH,
  },
  // Kristopher — positioning, messaging, differentiation (strategy focus)
  {
    id: "kristopher-positioning",
    founderSlug: "kristopher-williams",
    headline: "Why brand positioning matters",
    paragraph:
      "If you can't say who you serve and what you're best at, your audience won't figure it out for you. Clear positioning makes every page easier to write and every design decision easier to make.",
    ctaLabel: "Request Competitor Snapshot",
    ctaHref: COMPETITOR_SNAPSHOT_PATH,
  },
  {
    id: "kristopher-messaging",
    founderSlug: "kristopher-williams",
    headline: "Why messaging clarity is essential",
    paragraph:
      "Vague copy sounds like everyone else. Specific messaging—who you help, what outcome you deliver—builds trust and helps the right people choose you. Strategy should guide both design and website.",
    ctaLabel: "Request Digital Growth Audit",
    ctaHref: AUDIT_PATH,
  },
  {
    id: "kristopher-blend",
    founderSlug: "kristopher-williams",
    headline: "How businesses blend into competitors",
    paragraph:
      "When everyone says they're 'trusted' and 'quality-driven,' no one stands out. Differentiation comes from being specific: who you serve, what you're best at, and what you deliver that others don't.",
    ctaLabel: "Request Competitor Snapshot",
    ctaHref: COMPETITOR_SNAPSHOT_PATH,
  },
];

// ——— Helpers ———

const FOUNDER_LOGO: Record<FounderSlug, string> = {
  "anthony-feaster": ASCENDRA_LOGO,
  denishia: MACON_LOGO,
  "kristopher-williams": STYLE_STUDIO_LOGO_LIGHT,
};

export function getFounderBySlug(slug: FounderSlug): FounderProfile | undefined {
  return FOUNDERS.find((f) => f.slug === slug);
}

export function getInsightsByFounder(slug: FounderSlug): PartnerInsightItem[] {
  return PARTNER_INSIGHTS.filter((i) => i.founderSlug === slug);
}

/** One insight per founder for homepage "Built by specialists" section */
export function getOneInsightPerFounder(): PartnerInsightItem[] {
  const byFounder: Record<FounderSlug, PartnerInsightItem> = {} as Record<
    FounderSlug,
    PartnerInsightItem
  >;
  for (const insight of PARTNER_INSIGHTS) {
    if (!byFounder[insight.founderSlug]) {
      byFounder[insight.founderSlug] = insight;
    }
  }
  return [byFounder["anthony-feaster"], byFounder["denishia"], byFounder["kristopher-williams"]].filter(
    Boolean
  );
}

/** Resolve image URL for a founder (photo or logo) */
export function getFounderImageUrl(founder: FounderProfile): string {
  if (founder.image) return founder.image;
  return FOUNDER_LOGO[founder.slug] ?? "";
}

/** One insight for "Insights from the Ecosystem" on article/breakdown/audit pages. Rotates by index. */
export function getOneInsightForPage(pageKey: string): PartnerInsightItem | undefined {
  const hash = pageKey.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const index = Math.abs(hash) % PARTNER_INSIGHTS.length;
  return PARTNER_INSIGHTS[index];
}
