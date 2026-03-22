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
  // —— High-ticket market personas (verify external figures; never invent stats in client-facing copy) ——
  {
    id: "lena-scaled-trades",
    displayName: "Lena – Scaled Home Services Operator",
    segment: "Multi-crew / multi-territory trades (HVAC, plumbing, electrical, restoration)",
    revenueBand: "High-ticket ops (verify revenue & payroll per account)",
    summary:
      "Runs or co-owns a growing trades operation with multiple crews or territories. Buys serious marketing, websites, and conversion work because each booked job has high margin and LTV.",
    strategicNote:
      "Real-world verification: use U.S. Census County Business Patterns (CBP) for establishment counts and payroll in your service counties — https://www.census.gov/programs-surveys/cbp.html . For labor cost context, see BLS Occupational Employment and Wage Statistics — https://www.bls.gov/oes/ . Refresh before proposals; do not cite stale or invented market numbers.",
    problemsJson: [
      "Paid lead costs rising; need landing pages and offers that convert",
      "Brand and website don’t match the quality of in-field work",
      "Dispatch and sales say “we’re busy” but margin per job is uneven",
    ],
    goalsJson: [
      "Higher close rate on high-ticket installs and replacements",
      "Clear service-area SEO and map presence without gimmicks",
      "Attribution that finance trusts (call tracking, CRM, not vanity metrics)",
    ],
    objectionsJson: [
      "Our trucks are full; we don’t need marketing",
      "We already pay a lead-gen vendor",
    ],
    dynamicSignalsJson: [
      "Local Services Ads and LSA reputation signals continue to shape who gets the call",
      "Refresh CBP/BLS snapshots quarterly for territory planning — links in strategic note",
    ],
  },
  {
    id: "victor-practice-admin",
    displayName: "Victor – Practice Owner / Administrator (Dental & Elective Care)",
    segment: "Outpatient healthcare — dental, med spa, elective specialty",
    revenueBand: "High-ticket patient procedures (verify payer mix locally)",
    summary:
      "Decision-maker for a practice where case value is high and competition is local and map-driven. Needs trustworthy web, clear offers, and compliance-aware messaging—not hype.",
    strategicNote:
      "Real-world context (U.S.): CDC Oral Health data hub for national oral-health statistics — https://www.cdc.gov/oralhealth/data-statistics/index.html — use for macro trends only. For your market, verify demographics and competition with Census data tools — https://www.census.gov/data.html — and payer mix with local knowledge. Never fabricate clinical or market statistics.",
    problemsJson: [
      "Website feels generic; doesn’t reflect specialty or outcomes patients care about",
      "High cost per booked consult from ads; landing pages don’t match ad intent",
      "Reviews and reputation are strong in-office but weak online",
    ],
    goalsJson: [
      "More booked consults for high-value procedures",
      "HIPAA-aware forms and clear privacy messaging",
      "Differentiation vs. other practices in the same map pack",
    ],
    objectionsJson: [
      "Compliance won’t let us say much online",
      "Our patients come from referrals only",
    ],
    dynamicSignalsJson: [
      "Patient search behavior stays local-first; map and review signals matter",
      "Re-check CDC/Census releases when updating copy — dates and metrics change",
    ],
  },
  {
    id: "priya-b2b-services-partner",
    displayName: "Priya – B2B Services Firm Partner (IT, Ops, Professional)",
    segment: "Mid-market B2B — implementation, managed services, advisory",
    revenueBand: "Six-figure deals; multi-stakeholder buying (verify per pursuit)",
    summary:
      "Partner or practice lead selling complex B2B engagements. Site and collateral must support long cycles, security questions, and procurement—high ticket, low tolerance for amateur web.",
    strategicNote:
      "Real-world verification: U.S. Census Statistics of U.S. Businesses (SUSB) for firm size and industry structure — https://www.census.gov/programs-surveys/susb.html . For IT/digital economy context, see BEA digital economy estimates (methodology and releases) — https://www.bea.gov/data/special-topics/digital-economy . Use for framing, not fabricated deal benchmarks.",
    problemsJson: [
      "Website reads like 2015; loses to larger firms on credibility",
      "Case studies exist but aren’t packaged for each vertical",
      "Marketing and sales disagree on what a “qualified” opportunity is",
    ],
    goalsJson: [
      "Clear service lines, proof, and security/privacy signals on the site",
      "Content that supports RFPs and outbound without sounding hollow",
      "Shorter path from first touch to technical scoping call",
    ],
    objectionsJson: [
      "We win on relationships, not the website",
      "Procurement only cares about price",
    ],
    dynamicSignalsJson: [
      "Buyers self-serve research before taking a call; weak sites extend cycles",
      "Refresh SUSB/BEA references when building vertical pitches — links in strategic note",
    ],
  },
  {
    id: "james-dtc-scale",
    displayName: "James – Established DTC / E-commerce Operator",
    segment: "DTC brand past early traction — ops, retention, and CAC pressure",
    revenueBand: "Scaling GMV (verify with client; no assumed ARR in copy)",
    summary:
      "Owns or leads growth for a product brand selling online. High spend on ads and creators; needs site speed, CRO, LTV plays, and messaging that survives iOS/privacy changes.",
    strategicNote:
      "Real-world verification: U.S. Census Monthly Retail Trade and related retail indicators — https://www.census.gov/retail/index.html — for macro retail e-commerce trends. For broader economic context, FRED (Federal Reserve Economic Data) — https://fred.stlouisfed.org/ — search series your finance team already uses. Pull current values in spreadsheets or slides; do not hard-code percentages in the CMS that will go stale.",
    problemsJson: [
      "Rising CAC; landing pages and PDPs don’t test fast enough",
      "Site speed and Core Web Vitals hurt paid social and organic",
      "Email/SMS and retention underbuilt vs. acquisition spend",
    ],
    goalsJson: [
      "Repeatable CRO experiments and clearer offer hierarchy",
      "Site and funnel that match premium positioning",
      "Better LTV metrics and cohort reporting marketing can act on",
    ],
    objectionsJson: [
      "Shopify apps will fix conversion",
      "We’ll fix creative before the site",
    ],
    dynamicSignalsJson: [
      "Privacy and attribution changes keep shifting paid channel efficiency",
      "Re-pull Census retail / FRED series when building board-level growth narratives",
    ],
  },
];
