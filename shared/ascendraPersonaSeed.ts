import type { InsertMarketingPersonaRow } from "./ascendraIntelligenceSchema";

/** Seed rows for `marketing_personas` — Ascendra core customer targets (not app users). */
export const DEFAULT_MARKETING_PERSONAS: InsertMarketingPersonaRow[] = [
  {
    id: "marcus",
    displayName: "Marcus – Skilled Trades Owner",
    segment: "Skilled trades",
    revenueBand: null,
    summary:
      "Owns or runs a trades business (electrical, HVAC, plumbing, locksmith, etc.). Wants more qualified calls and a website that converts.",
    strategicNote: null,
    problemsJson: [
      "Phone rings with price-shoppers, not ideal jobs",
      "Website looks dated or is a digital brochure",
      "Competitors show up higher in local search",
    ],
    goalsJson: [
      "More booked jobs from the right ZIPs",
      "Clear offer and proof on the site",
      "Systems for follow-up and reviews",
    ],
    objectionsJson: [
      "I get enough work from referrals",
      "I tried SEO/marketing and it didn’t work",
    ],
    dynamicSignalsJson: [
      "Google Local Services and map pack competition",
      "Rising customer expectation for instant booking and SMS",
    ],
  },
  {
    id: "kristopher",
    displayName: "Kristopher – Branding Studio Owner",
    segment: "Creative agency / branding",
    revenueBand: null,
    summary:
      "Runs a small branding or design studio. Sells strategy and craft but struggles to productize and scale pipeline.",
    strategicNote: null,
    problemsJson: [
      "Feast-or-famine project flow",
      "Scope creep on fixed-fee work",
      "Hard to differentiate from Fiverr or “cheap logo” shops",
    ],
    goalsJson: [
      "Premium positioning and better-fit clients",
      "Repeatable discovery → proposal process",
      "Portfolio and case studies that close deals",
    ],
    objectionsJson: [
      "My work speaks for itself",
      "I don’t want to sound salesy",
    ],
    dynamicSignalsJson: [
      "AI tooling shifting client expectations on speed",
      "Demand for brand + web + funnel as a bundle",
    ],
  },
  {
    id: "tasha",
    displayName: "Tasha – Beauty Business Owner",
    segment: "Beauty / wellness services",
    revenueBand: null,
    summary:
      "Salon, suite, or independent beauty pro building local clientele and possibly education/product lines.",
    strategicNote: null,
    problemsJson: [
      "Instagram-dependent booking; algorithm shifts hurt",
      "No-shows and last-minute cancellations",
      "Hard to stand out in a crowded local market",
    ],
    goalsJson: [
      "Consistent bookings mid-week",
      "Email/SMS list for promotions",
      "Premium service tiers",
    ],
    objectionsJson: [
      "My clients are all on social",
      "I don’t have time for a website",
    ],
    dynamicSignalsJson: [
      "Short-form video as primary discovery",
      "Local SEO + reviews still drive high-intent traffic",
    ],
  },
  {
    id: "devon",
    displayName: "Devon – Early SaaS Founder",
    segment: "Early-stage SaaS",
    revenueBand: null,
    summary:
      "Pre–PMF or early revenue; needs positioning, landing clarity, and a path to repeatable acquisition.",
    strategicNote: null,
    problemsJson: [
      "Messaging is too broad or too technical",
      "Low trial-to-paid or demo booking rate",
      "Founder-led sales not scalable",
    ],
    goalsJson: [
      "Clear ICP and use-case pages",
      "Experimentation roadmap (ads, content, partners)",
      "Credible site and product story for investors",
    ],
    objectionsJson: [
      "We’ll iterate product first, then marketing",
      "We can’t afford an agency yet",
    ],
    dynamicSignalsJson: [
      "PLG vs sales-led tension in GTM",
      "AI features as table stakes in many categories",
    ],
  },
  {
    id: "andre",
    displayName: "Andre – Consultant / Freelancer",
    segment: "Independent expert",
    revenueBand: null,
    summary:
      "Sells expertise (ops, marketing, tech, fractional). Wants authority, pipeline, and better proposals.",
    strategicNote: null,
    problemsJson: [
      "Inbound is inconsistent",
      "Proposals take forever and still lose to cheaper options",
      "Website undersells depth of experience",
    ],
    goalsJson: [
      "Two to three repeatable offers with clear outcomes",
      "Content that demonstrates thinking, not fluff",
      "Higher effective rate and fewer bad-fit clients",
    ],
    objectionsJson: [
      "I don’t want to niche down",
      "LinkedIn is enough for me",
    ],
    dynamicSignalsJson: [
      "Rise of fractional executive models",
      "Buyers expect productized diagnostics before big engagements",
    ],
  },
  {
    id: "denishia",
    displayName: "Denishia – Creative Studio Owner (Macon Designs)",
    segment: "Hybrid creative entrepreneur / partner-level persona",
    revenueBand: "$2K–$10K/month",
    summary:
      "Creative studio owner balancing craft with business development; Macon Designs–aligned profile for targeting and partner-level conversations.",
    strategicNote:
      "Treat as both TARGET and strategic partner lens: creative integrity matters; position systems as amplifying vision, not replacing it.",
    problemsJson: [
      "Inconsistent client flow",
      "Underpricing creative work",
      "No funnel or repeatable acquisition system",
      "Heavy reliance on referrals and DMs",
    ],
    goalsJson: [
      "Better-fit clients who value strategy + execution",
      "More consistent monthly income",
      "Scalable systems without losing creative edge",
    ],
    objectionsJson: [
      "I don’t want to lose creative control",
      "Funnels feel generic or “bro marketing”",
    ],
    dynamicSignalsJson: [
      "AI competition rising in design and content",
      "Clients asking for strategy + funnels, not just deliverables",
      "Shift toward productized services and clear packages",
    ],
  },
];
