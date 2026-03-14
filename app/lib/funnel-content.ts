export interface EcosystemPillar {
  name: string;
  role: string;
  summary: string;
  /** Logo path for partner card (e.g. on About page). */
  logo?: string;
  /** Optional dark-theme logo. */
  logoDark?: string;
  /** Partner page path for the card link. */
  href?: string;
}

export interface PremiumOffer {
  slug: "website-optimization" | "brand-website" | "business-growth";
  name: string;
  audience: string;
  outcome: string;
  includes: string[];
}

export const POSITIONING_STATEMENT =
  "Strategy + Design + Technology for businesses that need to attract, convert, and grow.";

export const ECOSYSTEM_PILLARS: EcosystemPillar[] = [
  {
    name: "Style Studio Branding",
    role: "Brand strategy, messaging, and positioning",
    summary:
      "Clarifies how your business should be understood so your market immediately gets what you do and why it matters.",
    logo: "/Ascendra images/Stylestudiologos/StyleStudio_Blk_Rd_.png",
    logoDark: "/Ascendra images/Stylestudiologos/StyleStudio_Wt_Rd_.png",
    href: "/partners/style-studio-branding",
  },
  {
    name: "Macon Designs®",
    role: "Visual design and creative asset execution",
    summary:
      "Improves visual quality across your web presence so your business looks established, intentional, and trustworthy.",
    logo: "/Ascendra images/logomacondesigns/Macon Designs_Logo_Tagline_Badge.png",
    href: "/partners/macon-designs",
  },
  {
    name: "Ascendra Technologies",
    role: "Web systems, funnels, performance, and automation",
    summary:
      "Builds and optimizes the digital system that turns traffic and referrals into qualified leads and booked conversations.",
    logo: "/ascendra-logo.svg",
    href: "/partners/ascendra-technologies",
  },
];

export const PREMIUM_OFFERS: PremiumOffer[] = [
  {
    slug: "website-optimization",
    name: "Website Optimization System",
    audience:
      "Businesses with an existing website that need better performance and more leads.",
    outcome:
      "Improved clarity, stronger CTAs, better mobile experience, and conversion issues fixed so your site turns more visitors into opportunities.",
    includes: [
      "Clarity and structure improvements",
      "Stronger CTAs and conversion path",
      "Mobile experience optimization",
      "Lead capture and conversion fixes",
    ],
  },
  {
    slug: "brand-website",
    name: "Brand + Website System",
    audience:
      "Businesses that need stronger presentation and a better website. Includes collaboration with Macon Designs®.",
    outcome:
      "Visual refresh, improved presentation, website redesign, and clearer messaging so your business looks and communicates more effectively.",
    includes: [
      "Visual refresh and presentation quality",
      "Website redesign or strategic refresh",
      "Clearer messaging and alignment",
      "Lead path and conversion planning",
    ],
  },
  {
    slug: "business-growth",
    name: "Business Growth System",
    audience:
      "Businesses that need strategy, design, and technology aligned. Includes Style Studio Branding, Macon Designs®, and Ascendra Technologies.",
    outcome:
      "Positioning clarity, improved presentation, and conversion-ready website systems so you grow with one coordinated team.",
    includes: [
      "Brand positioning and messaging clarity",
      "Visual direction and execution",
      "Website and funnel implementation",
      "Conversion and growth support",
    ],
  },
];

export const CHALLENGE_OPTIONS = [
  "Unclear branding",
  "Outdated website",
  "Low conversions",
  "No lead funnel",
  "Poor online trust",
  "Launching from scratch",
  "Need all-in-one help",
] as const;

export const STAGE_OPTIONS = [
  "Early stage / launch",
  "Established but inconsistent growth",
  "Actively scaling",
  "Repositioning or relaunching",
] as const;

export const HELP_OPTIONS = [
  "Brand strategy and messaging",
  "Visual presentation and design support",
  "Website optimization",
  "Website redesign",
  "Lead funnel setup",
  "Automation and systems",
] as const;

export const BUDGET_OPTIONS = [
  "Under $1,500",
  "$1,500-$3,500",
  "$3,500-$7,500",
  "$7,500+",
] as const;

/** Optional "prefer not to say" for lower-friction quote/call forms */
export const BUDGET_OPTIONS_WITH_FLEXIBLE = [
  ...BUDGET_OPTIONS,
  "Not sure yet",
] as const;

export const TIMELINE_OPTIONS = [
  "As soon as possible",
  "Within 30 days",
  "1-3 months",
  "3+ months",
] as const;
