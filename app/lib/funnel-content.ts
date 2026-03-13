export interface EcosystemPillar {
  name: string;
  role: string;
  summary: string;
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
  },
  {
    name: "Macon Designs®",
    role: "Visual design and creative asset execution",
    summary:
      "Improves visual quality across your web presence so your business looks established, intentional, and trustworthy.",
  },
  {
    name: "Ascendra Technologies",
    role: "Web systems, funnels, performance, and automation",
    summary:
      "Builds and optimizes the digital system that turns traffic and referrals into qualified leads and booked conversations.",
  },
];

export const PREMIUM_OFFERS: PremiumOffer[] = [
  {
    slug: "website-optimization",
    name: "Website Optimization System",
    audience:
      "Best for businesses with an existing identity that need better website performance and conversions.",
    outcome:
      "A stronger, faster, conversion-focused website that captures more qualified leads.",
    includes: [
      "Website UX and structure improvements",
      "Stronger CTA and conversion path design",
      "Mobile experience optimization",
      "Lead capture improvements",
      "Conversion-focused page updates",
    ],
  },
  {
    slug: "brand-website",
    name: "Brand + Website System",
    audience:
      "Best for businesses that need stronger presentation and a better-performing website.",
    outcome:
      "A clearer visual identity and a high-trust website built to attract and convert.",
    includes: [
      "Visual refresh and presentation quality upgrades",
      "Website redesign or strategic refresh",
      "Message-to-design alignment",
      "Lead funnel setup",
      "Core conversion page planning",
    ],
  },
  {
    slug: "business-growth",
    name: "Business Growth System",
    audience:
      "Best for businesses needing strategy, design, and technology coordinated together.",
    outcome:
      "A complete growth system with positioning, design, website funnel execution, and automation support.",
    includes: [
      "Brand positioning support",
      "Messaging clarity and strategic direction",
      "Visual direction and execution",
      "Website and funnel implementation",
      "Automation and growth support",
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

export const TIMELINE_OPTIONS = [
  "As soon as possible",
  "Within 30 days",
  "1-3 months",
  "3+ months",
] as const;
