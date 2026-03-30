/**
 * Ascendra landing pages & lead magnets — outcome-led copy framework.
 * Use `OutcomeLandingFramework` + these presets, or paste `LANDING_LEAD_MAGNET_WORKFLOW_TEMPLATE` in Content Studio workflow.
 */

export type OutcomeLandingFrameworkCopy = {
  audienceLabel?: string;
  perceivedOutcomes: { heading: string; bullets: string[] };
  painAndStruggles: { heading: string; bullets: string[] };
  whatIfNoAction: { heading: string; bullets: string[] };
  realValue: { heading: string; intro?: string; bullets: string[] };
  /** Short legal/clarity line — not a guarantee. */
  disclaimer?: string;
};

export const DEFAULT_OUTCOME_LANDING_DISCLAIMER =
  "We describe typical aims and what clients work toward—your results depend on market, execution, and follow-through.";

/** Copy-paste outline for new pages, emails, or Content Studio drafts. */
export const LANDING_LEAD_MAGNET_WORKFLOW_TEMPLATE = `
LANDING / LEAD MAGNET — OUTCOME FRAMEWORK (Ascendra)
====================================================

1) AUDIENCE (one line)
   Who this is for: ___________________________________________

2) PERCEIVED OUTCOMES ("you're trying to get to…")
   • _________________________________________________________
   • _________________________________________________________
   • _________________________________________________________

3) PAIN & STRUGGLES (specific, not vague)
   • _________________________________________________________
   • _________________________________________________________
   • _________________________________________________________

4) WHAT IF THEY DON'T? (cost of inaction — time, money, reputation; no fear-mongering)
   • _________________________________________________________
   • _________________________________________________________
   • _________________________________________________________

5) REAL VALUE WE PROVIDE (mechanism + proof path; tie to outcomes)
   Intro (optional): _________________________________________
   • _________________________________________________________
   • _________________________________________________________
   • _________________________________________________________

6) PRIMARY CTA + NEXT STEP
   CTA: ______________________  URL: ________________________

7) DISCLAIMER (always)
   Outcomes aren't guaranteed. Individual results vary. __________
`.trim();

/** Shorter variant for /journey selector (keeps page scannable). */
export const OUTCOME_FRAMEWORK_COPY_JOURNEY: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Pick your path",
  perceivedOutcomes: {
    heading: "What you’re usually after",
    bullets: [
      "Clear next steps—not another generic marketing page",
      "Tools and CTAs matched to how you actually make money",
    ],
  },
  painAndStruggles: {
    heading: "What stalls growth",
    bullets: [
      "You’re busy but pipeline is uneven or full of wrong-fit leads",
      "Brand, site, and follow-up don’t line up—so traffic doesn’t compound",
    ],
  },
  whatIfNoAction: {
    heading: "If you never align the system",
    bullets: [
      "You keep paying for attention that doesn’t convert to booked work",
      "Every new campaign starts from scratch because the foundation’s unclear",
    ],
  },
  realValue: {
    heading: "How Ascendra approaches it",
    intro: "Diagnose → build → scale: same framework as our client growth system—outcome language, not a guarantee.",
    bullets: [
      "Match you to the right diagnostic, audit, or call for your situation",
      "Coordinate strategy, design, and web when you’re ready for implementation",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_HOME: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Growth-focused businesses",
  perceivedOutcomes: {
    heading: "What you're usually trying to achieve",
    bullets: [
      "Consistent leads and booked work—not random spikes of traffic",
      "A brand and site that make the right buyers say “yes” faster",
      "Systems that follow up so opportunities don’t quietly die",
    ],
  },
  painAndStruggles: {
    heading: "What gets in the way",
    bullets: [
      "Messaging that’s vague—visitors aren’t sure who you serve or why you’re different",
      "Design that doesn’t match the quality of your work",
      "Traffic with no clear capture path—or forms that never get nurtured",
    ],
  },
  whatIfNoAction: {
    heading: "If nothing changes",
    bullets: [
      "You keep paying for attention that doesn’t turn into qualified conversations",
      "Competitors who look more “together” win the click and the call",
      "Growth stays dependent on whoever posted last—not a repeatable system",
    ],
  },
  realValue: {
    heading: "What Ascendra actually brings",
    intro:
      "One coordinated path across strategy, design, and technology—so you’re not stitching freelancers and guesswork together.",
    bullets: [
      "Diagnose where the real bottleneck is (message, presentation, or conversion system)",
      "Build the site, funnel, and automation pieces that match that diagnosis",
      "Scale only what’s already working—without burning budget on broken foundations",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_CONTRACTORS: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Contractors & trades",
  perceivedOutcomes: {
    heading: "The outcomes owners tell us they want",
    bullets: [
      "More booked jobs—not just more calls from price-shoppers",
      "Fewer leads slipping through because nobody followed up fast enough",
      "A professional online presence that matches the quality of your crews",
    ],
  },
  painAndStruggles: {
    heading: "What we see most often",
    bullets: [
      "The site looks fine but doesn’t guide people to one clear next step",
      "Mobile is clunky—the customer bounces before they ever call",
      "Local visibility and trust signals don’t match how good you actually are",
    ],
  },
  whatIfNoAction: {
    heading: "If you don’t fix the system",
    bullets: [
      "You stay dependent on referrals and luck when you want predictable work",
      "Cheap ads and busy seasons mask the problem—then dry spells hurt more",
      "You lose bids to competitors who simply look easier to hire online",
    ],
  },
  realValue: {
    heading: "What you get working with us",
    intro:
      "We build contractor-focused sites and automation meant for real-world sales cycles—not generic templates.",
    bullets: [
      "Clear offer + proof on the page so the right ZIPs and job types say yes",
      "Lead capture and follow-up structure so calls and forms turn into booked work",
      "Technical and local-SEO-friendly foundations so you’re not invisible on the map",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_LOCAL_BUSINESS: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Local practices & professional firms",
  perceivedOutcomes: {
    heading: "What practices are usually optimizing for",
    bullets: [
      "A full calendar with the right patients or clients—not empty slots",
      "Online trust that matches the care and professionalism you deliver in person",
      "Less chaos at the front desk from broken booking or unclear directions",
    ],
  },
  painAndStruggles: {
    heading: "Where sites quietly fail",
    bullets: [
      "The website feels dated compared to competitors down the street",
      "Booking is confusing—or people call and get stuck in voicemail loops",
      "You get traffic but weak conversion because the story and CTAs are unclear",
    ],
  },
  whatIfNoAction: {
    heading: "If the digital experience stays weak",
    bullets: [
      "High-intent searches go to practices that look more credible online",
      "Staff time burns on “just checking your website” questions and no-shows",
      "Growth stays capped by word-of-mouth even when you’re ready for more",
    ],
  },
  realValue: {
    heading: "How we help",
    intro: "Sites and scheduling flows built for trust-heavy, local service buyers.",
    bullets: [
      "Messaging and structure that reduce friction from first visit to booked appointment",
      "Professional presentation that reflects the standard of your practice",
      "Capture and follow-up patterns so leads don’t vanish after one visit",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_DIGITAL_AUDIT: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Digital Growth Audit",
  perceivedOutcomes: {
    heading: "Why people request this audit",
    bullets: [
      "Plain-English clarity on why the site isn’t pulling its weight",
      "A prioritized list—not a vague “redesign everything” pitch",
      "Confidence about whether brand, design, or conversion is the real leak",
    ],
  },
  painAndStruggles: {
    heading: "The struggles behind the request",
    bullets: [
      "Traffic or spend without enough qualified inquiries",
      "Visitors bounce because the story or proof doesn’t land fast enough",
      "Partners or agencies gave opinions—but no shared picture across brand + site",
    ],
  },
  whatIfNoAction: {
    heading: "If you keep guessing",
    bullets: [
      "You invest in the wrong layer first (pretty redesign vs. offer, or ads vs. capture)",
      "Small UX issues keep silently taxxing every campaign you run",
      "Teams stay misaligned on what “good” looks like for your customer",
    ],
  },
  realValue: {
    heading: "What this audit gives you",
    intro: "A coordinated human review across brand clarity, visual credibility, and conversion—not a single automated score.",
    bullets: [
      "Where positioning and messaging may be costing trust",
      "Whether the visual experience supports or undermines your price and quality",
      "Whether the site is structured to capture and move leads forward",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_FREE_TOOLS: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Free growth tools",
  perceivedOutcomes: {
    heading: "What you’re trying to get from these tools",
    bullets: [
      "A honest read on where you stand before you spend big",
      "Next steps you can act on—not another PDF you never open",
      "A path to deeper help only if it actually fits",
    ],
  },
  painAndStruggles: {
    heading: "The problems these tools address",
    bullets: [
      "Not knowing which lever is broken: market, message, site, or follow-up",
      "Overwhelm from too many disconnected “freebies” with no system",
      "Vanity metrics that don’t connect to leads or revenue",
    ],
  },
  whatIfNoAction: {
    heading: "If you skip clarity",
    bullets: [
      "You keep trying random tactics in the wrong order",
      "Budget and time leak into fixes that don’t move booked work",
      "You stay stuck between “I should DIY” and “I need help”—with no data",
    ],
  },
  realValue: {
    heading: "What Ascendra’s tool hub is for",
    intro: "Tools wired into one ecosystem—optionally followed by qualified human follow-up when you ask for it.",
    bullets: [
      "Diagnostics and calculators that point at the real constraint",
      "Clear bridges from free insight to strategy calls or scoped work",
      "No bait-and-switch—see value before you commit to anything paid",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_REBRAND: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Rebrand & upgrade",
  perceivedOutcomes: {
    heading: "What a rebrand should unlock",
    bullets: [
      "Pricing and positioning that match how good you’ve actually become",
      "A site that converts at the level of your offline reputation",
      "Creative and web that stay aligned so campaigns stop fighting each other",
    ],
  },
  painAndStruggles: {
    heading: "What businesses feel before they rebrand",
    bullets: [
      "Embarrassment sending people to the site—or apologizing for it on calls",
      "Inconsistent visuals across ads, deck, and storefront",
      "You’ve outgrown the story but the digital presence still tells the old one",
    ],
  },
  whatIfNoAction: {
    heading: "If the mismatch stays",
    bullets: [
      "You lose deals you should win to competitors who simply look more current",
      "Recruiting and partnerships get harder—“are these folks legit?”",
      "Every new offer launch fights legacy design debt",
    ],
  },
  realValue: {
    heading: "What coordinated rebrand work delivers",
    intro: "Identity, site, and marketing visuals sequenced so you’re not re-doing the same screens twice.",
    bullets: [
      "Clear updated story and proof on the page",
      "Modern structure for leads, bookings, or e-commerce—whatever you sell",
      "Asset packs that match the new system—not one-off exports",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_LAUNCH: OutcomeLandingFrameworkCopy = {
  audienceLabel: "New business launch",
  perceivedOutcomes: {
    heading: "What a real launch should feel like",
    bullets: [
      "You look credible on day one—not like a side project",
      "Website, identity, and first marketing assets tell one story",
      "You can point people to one clear place to book or buy",
    ],
  },
  painAndStruggles: {
    heading: "What DIY launch usually creates",
    bullets: [
      "Mismatched logo, site, and social that confuse early buyers",
      "Months lost to templates while messaging stays fuzzy",
      "A pretty page that still doesn’t explain why someone should choose you",
    ],
  },
  whatIfNoAction: {
    heading: "If you stay in “almost launched” mode",
    bullets: [
      "Partners and early customers quietly question whether you’re serious",
      "You burn runway on revisions that a system would have prevented",
      "You launch loud once—then stall because there’s no conversion path",
    ],
  },
  realValue: {
    heading: "What this path is designed to deliver",
    intro: "Brand identity, site, and launch kit coordinated through the Brand Growth team—not three unrelated orders.",
    bullets: [
      "Strategy-first sequencing so design and dev aren’t wasted",
      "Conversion-minded site structure, not just visuals",
      "Launch assets you can actually post and email without starting from zero",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_STARTUP_MVP: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Startup MVP & product builds",
  perceivedOutcomes: {
    heading: "What founders usually want from an MVP build",
    bullets: [
      "Something real in market fast—without painting yourself into a rewrite",
      "Architecture you can iterate on when traction shows up",
      "A partner who translates product intent into shipped software",
    ],
  },
  painAndStruggles: {
    heading: "What breaks without the right partner",
    bullets: [
      "Offshore or “cheap MVP” stacks that collapse at first real usage",
      "Scope explosions because nobody mapped acceptance criteria",
      "Founders stuck babysitting infra instead of selling and learning",
    ],
  },
  whatIfNoAction: {
    heading: "If you keep delaying or outsourcing blindly",
    bullets: [
      "You miss windows while competitors ship and learn in market",
      "Technical debt compounds—future features cost 2–3× what they should",
      "Investors and design partners lose confidence when demos flake",
    ],
  },
  realValue: {
    heading: "What Ascendra brings to MVP work",
    intro: "Scoping, build, and deployment with conversion and growth systems in mind—not a throwaway prototype.",
    bullets: [
      "Clear milestones tied to what you need to learn next",
      "Modern stack choices that match your stage and team",
      "Path to funnels, auth, and integrations as you graduate from MVP",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_MARKETING_ASSETS: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Marketing & promotional assets",
  perceivedOutcomes: {
    heading: "What stronger creative is supposed to do",
    bullets: [
      "Ads and posts that earn attention and match your price point",
      "Assets you can ship this week—not stuck in endless revision",
      "One visual language across campaigns so buyers recognize you instantly",
    ],
  },
  painAndStruggles: {
    heading: "What we hear from teams",
    bullets: [
      "Brand guidelines exist—but feeds and ads still look like five different companies",
      "Canva exports don’t hold up in print, packaging, or serious B2B pitches",
      "Creative bottlenecks stall launches while the site and offer are ready",
    ],
  },
  whatIfNoAction: {
    heading: "If creative stays inconsistent",
    bullets: [
      "CTR and conversion suffer because the promise on the ad doesn’t match the landing experience",
      "You burn media spend polishing the wrong hook",
      "Partners and retailers treat you like a hobby brand—not a default supplier",
    ],
  },
  realValue: {
    heading: "What Style Studio–led production delivers",
    intro: "Production-ready marketing assets aligned with Macon identity and Ascendra web when you’re on the full ecosystem.",
    bullets: [
      "Formats built for the channels you actually run (paid, organic, print)",
      "Files your team or agency can implement without emergency fixes",
      "Clear handoffs when you need landing pages or automation from Ascendra",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_BRAND_GROWTH: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Brand Growth ecosystem",
  perceivedOutcomes: {
    heading: "What you’re building toward",
    bullets: [
      "A brand and site that convert—not just look polished in a deck",
      "Creative and web that stay aligned so ads and landing pages tell one story",
      "Faster decisions because strategy, identity, and build aren’t siloed",
    ],
  },
  painAndStruggles: {
    heading: "What breaks when teams aren’t coordinated",
    bullets: [
      "Beautiful identity that doesn’t show up consistently on the website",
      "Developers waiting on static assets—or designers guessing at dev constraints",
      "Messaging drift between Macon, Style Studio, and Ascendra touchpoints",
    ],
  },
  whatIfNoAction: {
    heading: "If you keep patching vendors in isolation",
    bullets: [
      "You pay for rework when handoffs don’t match",
      "Campaigns underperform because the promise on the ad ≠ the promise on the site",
      "Timeline slips while everyone negotiates who owns what",
    ],
  },
  realValue: {
    heading: "What the ecosystem is designed to deliver",
    intro:
      "Macon Designs (identity), Style Studio (marketing assets), Ascendra (web & automation)—one coordinated handoff model.",
    bullets: [
      "Strategy and visuals that translate into build-ready specifications",
      "Web execution that honours brand rules—not shortcut them",
      "A single strategic thread from first impression to conversion",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_GROWTH_LANDING: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Growth diagnosis",
  perceivedOutcomes: {
    heading: "Why people run this diagnosis",
    bullets: [
      "A prioritized picture of what’s slowing growth—not a laundry list",
      "Language your team can agree on (brand vs. site vs. systems)",
      "A sane next step instead of buying another tool at random",
    ],
  },
  painAndStruggles: {
    heading: "What usually hurts",
    bullets: [
      "You feel busy but pipeline is inconsistent",
      "You’ve tried marketing before and couldn’t tell what failed",
      "The site works “okay” but doesn’t create predictable conversations",
    ],
  },
  whatIfNoAction: {
    heading: "If you never name the bottleneck",
    bullets: [
      "Budget keeps going to symptoms while the root issue stays",
      "Internal debates drag on because there’s no shared read on the problem",
      "You lose quarters to incremental tweaks that don’t compound",
    ],
  },
  realValue: {
    heading: "What this step gives you",
    intro: "Targeted questions across brand, identity presence, site, leads, and automation—summarized into a clear read.",
    bullets: [
      "Where to focus first for the highest leverage",
      "How severe each gap is relative to the others",
      "Suggested follow-ups (tools, audit, or call) matched to your situation",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_MARKET_SCORE: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Market Score (free snapshot)",
  perceivedOutcomes: {
    heading: "What founders want from a market check",
    bullets: [
      "A fast sanity check before you pour time into the wrong offer or geo",
      "Honest language about demand, competition, and purchase power—not hype",
      "A reason to double down—or pivot—before you build",
    ],
  },
  painAndStruggles: {
    heading: "Without this kind of snapshot",
    bullets: [
      "You guess at TAM and learn the hard way after months of build",
      "You copy competitors without knowing if the market still supports the play",
      "You can’t explain the “why now” behind your pitch to partners or ads",
    ],
  },
  whatIfNoAction: {
    heading: "If you skip market clarity",
    bullets: [
      "You optimize a funnel for a market that’s already crowded or thin",
      "Pricing and positioning fight reality on the ground",
      "You burn creative and dev cycles on offers that needed pressure-testing first",
    ],
  },
  realValue: {
    heading: "What Market Score does",
    intro: "A structured snapshot tied to your offer and geography—CRM-linked if you choose follow-up.",
    bullets: [
      "Demand, competition, and purchase-power signals in one pass",
      "A grounded starting point for calls, landing pages, and paid tests",
      "Optional path to deeper strategy when you’re ready—not a forced upsell",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_OFFER_AUDIT: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Offer audit",
  perceivedOutcomes: {
    heading: "What you want from an offer check",
    bullets: [
      "Clear read on which part of the offer is weakest (promise, proof, risk reversal, etc.)",
      "Practical fixes—not just a score you can’t act on",
      "Confidence before you spend on ads, pages, or a full build",
    ],
  },
  painAndStruggles: {
    heading: "What tends to be broken",
    bullets: [
      "Strong traffic or interest—but the offer doesn’t close",
      "Messaging that sounds good to you but confuses the buyer",
      "Pricing and guarantee posture that don’t match perceived risk",
    ],
  },
  whatIfNoAction: {
    heading: "If you don’t pressure-test the offer",
    bullets: [
      "You keep polishing landing pages while the underlying promise stays fuzzy",
      "CAC stays high because conversion never compounds",
      "You blame “traffic” when the real leak is belief and clarity at the offer level",
    ],
  },
  realValue: {
    heading: "What this audit gives you",
    intro:
      "A structured valuation lens on your offer with prioritized upgrades—built to connect to funnel and web work when you’re ready.",
    bullets: [
      "A score broken into variables you can actually improve",
      "Diagnosis language you can share with team or partners",
      "A path to strategy support if you want hands-on help shaping the fix",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};

export const OUTCOME_FRAMEWORK_COPY_STARTUP_KIT: OutcomeLandingFrameworkCopy = {
  audienceLabel: "Startup growth kit",
  perceivedOutcomes: {
    heading: "If you’re early-stage, you probably want",
    bullets: [
      "To stop rebuilding the same half-finished site every quarter",
      "A simple order of operations so budget goes to clarity before vanity",
      "A realistic map for when DIY ends and partnership starts",
    ],
  },
  painAndStruggles: {
    heading: "What hurts on a tight budget",
    bullets: [
      "Templates and AI output without a message or funnel behind them",
      "Too many “assets,” not enough system (capture, follow-up, one main CTA)",
      "Shame or confusion about what to publish first",
    ],
  },
  whatIfNoAction: {
    heading: "If you stay in shuffle mode",
    bullets: [
      "You launch loud but don’t compound—every month feels like starting over",
      "You attract attention you can’t convert because the path isn’t built",
      "You delay revenue while polishing things users never see",
    ],
  },
  realValue: {
    heading: "What this kit is for",
    intro: "Education-first: why sites fail, assets vs. systems, how AI fits, and four layers to grow in order.",
    bullets: [
      "Plain-language mental models—not jargon for its own sake",
      "A roadmap you can execute lean before hiring a full team",
      "Clear bridges to audits, tools, and calls when you’re ready for hands-on help",
    ],
  },
  disclaimer: DEFAULT_OUTCOME_LANDING_DISCLAIMER,
};
