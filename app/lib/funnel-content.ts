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
      "See where visitors drop off before you pay for a full redesign",
      "Stronger CTAs and a single obvious next step per page",
      "Mobile experience that matches how people actually buy from you",
      "Capture and follow-up hooks that don’t depend on someone remembering",
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
      "Presentation that matches the quality of your offer and reviews",
      "Site redesign or strategic refresh with conversion in mind—not just a new look",
      "Messaging aligned to how buyers decide in your category",
      "Lead paths planned so design and sales don’t fight each other",
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
      "Positioning and messaging you can execute without re-explaining every week",
      "Visual direction tied to trust and conversion—not decoration",
      "Website and funnel implementation you can read leads from",
      "Ongoing refinement based on what the data shows, not opinions alone",
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

/** Lead qualifying / demographics for analytics (optional on forms) */
export const AGE_RANGE_OPTIONS = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55+",
] as const;

export const GENDER_OPTIONS = [
  "Female",
  "Male",
  "Non-binary",
  "Prefer not to say",
] as const;

export const OCCUPATION_OPTIONS = [
  "Founder / Owner",
  "Marketing lead",
  "Operations",
  "Sales",
  "Other",
] as const;

export const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
] as const;

/** Steps for sticky scroll storytelling: traffic → lead → customer */
export const FUNNEL_STORY_STEPS = [
  {
    id: "traffic",
    title: "Traffic",
    problem: "Visitors land on your site but leave without a clear path.",
    solution: "Clarity in messaging and structure so people know where to go next.",
  },
  {
    id: "capture",
    title: "Capture",
    problem: "No lead capture or weak forms mean opportunities slip away.",
    solution: "Strategic lead capture and low-friction next steps that fit your offer.",
  },
  {
    id: "qualify",
    title: "Qualify",
    problem: "Leads are mixed quality; follow-up is manual and inconsistent.",
    solution: "Clear qualification paths and systems so the right leads get the right attention.",
  },
  {
    id: "convert",
    title: "Convert",
    problem: "Meetings booked but don't show; proposals get no response.",
    solution: "Conversion-focused presentation and follow-up that builds trust and action.",
  },
  {
    id: "retain",
    title: "Retain",
    problem: "One-off projects; no ongoing growth or referral system.",
    solution: "Ongoing alignment so your digital presence keeps working as you grow.",
  },
] as const;
