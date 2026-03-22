/**
 * Public marketing persona journeys — single source for copy, CTAs, and lead magnets.
 * Admin/CMS can later load or override this; keep IDs stable for analytics and URLs (?journey=).
 */

export const PERSONA_JOURNEY_IDS = [
  "marcus-trades",
  "kristopher-studio",
  "tasha-beauty",
  "devon-saas",
  "chef-food",
  "denishia-creative",
] as const;

export type PersonaJourneyId = (typeof PERSONA_JOURNEY_IDS)[number];

export function isPersonaJourneyId(value: string): value is PersonaJourneyId {
  return (PERSONA_JOURNEY_IDS as readonly string[]).includes(value);
}

export interface PersonaJourneyLink {
  label: string;
  href: string;
}

export interface PersonaJourney {
  id: PersonaJourneyId;
  /** Card title on selector */
  selectorTitle: string;
  /** One-line hook on selector */
  selectorSubtitle: string;
  businessTypeLabel: string;
  pains: string[];
  goals: string[];
  headline: string;
  subhead: string;
  valueProposition: string;
  primaryLeadMagnet: PersonaJourneyLink & { blurb: string };
  secondaryLeadMagnet: PersonaJourneyLink & { blurb: string };
  primaryCta: PersonaJourneyLink;
  secondaryCta?: PersonaJourneyLink;
  recommendedService: PersonaJourneyLink & { rationale: string };
  trustIntro: string;
  trustPoints: string[];
  educationBlurb: string;
  /** Project `id` values from `app/lib/data.ts` `projects` — deep links to `/projects/[id]`. */
  caseStudyRefs?: string[];
  faqs: { question: string; answer: string }[];
}

export const PERSONA_JOURNEYS: PersonaJourney[] = [
  {
    id: "marcus-trades",
    selectorTitle: "Skilled trades owner",
    selectorSubtitle: "Locksmith, HVAC, electrical — you need calls and booked jobs.",
    businessTypeLabel: "Skilled trades (locksmith, HVAC, electrical)",
    pains: [
      "Website or Google Business Profile exists but the phone still runs hot-and-cold.",
      "You're competing on price because there's no steady pipeline or clear booking path.",
      "After-hours and emergency demand aren't captured — leads leak to whoever answers first.",
    ],
    goals: [
      "Predictable inbound calls and booked jobs from search and referrals.",
      "Simple automation: request → book → confirm — without a bloated stack.",
      "Proof you can show a partner or crew that marketing is paying for itself.",
    ],
    headline: "Turn sporadic calls into a steady job calendar",
    subhead:
      "You don't need fluff — you need a clear offer, local visibility, and a conversion path that books work while you're on a truck.",
    valueProposition:
      "Ascendra builds the lead and booking system around how trades actually win: clear service pages, trust signals, fast contact paths, and follow-up that doesn't depend on you remembering to text back at midnight.",
    primaryLeadMagnet: {
      label: "Request a Digital Growth Audit",
      href: "/digital-growth-audit",
      blurb: "We review where leads drop off between your site, GBP, and call-to-book flow — plain language, prioritized fixes.",
    },
    secondaryLeadMagnet: {
      label: "Run automated growth diagnosis",
      href: "/growth-diagnosis",
      blurb: "Benchmark clarity, trust, and conversion mechanics when you want numbers before a deeper conversation.",
    },
    primaryCta: { label: "See trades & contractor systems", href: "/contractor-systems" },
    secondaryCta: { label: "Book a strategy call", href: "/strategy-call" },
    recommendedService: {
      label: "Contractor & field-service growth systems",
      href: "/contractor-systems",
      rationale: "Built for owners who sell expertise and time — not downloads.",
    },
    trustIntro: "What we optimize for trades owners",
    trustPoints: [
      "Call and form paths that match how customers actually hire you (emergency vs planned).",
      "Local + referral traffic aligned to service pages that convert, not generic brochure copy.",
      "Automation for reminders and follow-up so jobs don't die in the inbox.",
    ],
    educationBlurb:
      "Most trades sites explain what you do; few explain why someone should call you now and how to book in one step. We fix that gap with systems, not a prettier logo.",
    caseStudyRefs: ["ssi-met-repairs", "keycode-help"],
    faqs: [
      {
        question: "We already run ads — why aren't the phones consistent?",
        answer:
          "Often the ad clicks land on weak pages, thin trust, or a clunky contact flow. We align spend with a single conversion path and measurable booking outcomes.",
      },
      {
        question: "I don't want a 20-step marketing program.",
        answer:
          "Neither do we. We prioritize the few changes that move booked jobs first, then layer automation where it saves you time.",
      },
    ],
  },
  {
    id: "kristopher-studio",
    selectorTitle: "Branding / design studio owner",
    selectorSubtitle: "Strong portfolio — you want premium clients and a real funnel.",
    businessTypeLabel: "Creative / branding studio",
    pains: [
      "Inbound is feast-or-famine; proposals chase tire-kickers as often as dream clients.",
      "Your work looks premium but your site and follow-up don't signal the same level.",
      "You're stuck trading time for estimates without a packaged, high-trust path to yes.",
    ],
    goals: [
      "Higher-quality leads who already understand value before the first call.",
      "A repeatable funnel: attract → qualify → book strategy → scoped proposal.",
      "Positioning and offers that support retainers and larger engagements.",
    ],
    headline: "Package premium creative work into a pipeline that closes",
    subhead:
      "You already understand brand — Ascendra builds the conversion layer: offer clarity, funnel structure, and automation behind the scenes.",
    valueProposition:
      "We connect your visual authority to revenue systems: sharper positioning on the page, proof and process blocks that pre-sell, and CTAs that move buyers toward strategy calls — not endless 'pick your brain' emails.",
    primaryLeadMagnet: {
      label: "Get the Homepage Conversion Blueprint",
      href: "/homepage-conversion-blueprint",
      blurb: "Structure your homepage so premium buyers see fit, process, and next step — not just a pretty gallery.",
    },
    secondaryLeadMagnet: {
      label: "Request a Digital Growth Audit",
      href: "/digital-growth-audit",
      blurb: "We stress-test how your site sells strategy, packages, and trust for high-ticket creative services.",
    },
    primaryCta: { label: "Book a strategy call", href: "/strategy-call" },
    secondaryCta: { label: "Explore marketing asset upgrades", href: "/marketing-assets" },
    recommendedService: {
      label: "Brand Growth ecosystem hub",
      href: "/brand-growth",
      rationale: "Aligns Ascendra systems with partner brand depth when you need the full story on one page.",
    },
    trustIntro: "Why studio owners work with us on systems, not just pixels",
    trustPoints: [
      "Funnel thinking that respects creative craft — no template that makes you look like everyone else.",
      "Premium CTAs and intake flows that filter budget and timeline before you invest in custom proposals.",
      "Automation for nurture and reminders so opportunities don't cool off while you're in production.",
    ],
    educationBlurb:
      "Great design earns attention; a growth system turns that attention into booked strategy and retained revenue. We build the second half so the first half scales.",
    caseStudyRefs: ["the-unauthorized-author", "web-development-services"],
    faqs: [
      {
        question: "We already have a nice site — what's missing?",
        answer:
          "Usually the path from 'impressed' to 'invested': packaged offers, proof of process, and a low-friction next step that qualifies buyers early.",
      },
      {
        question: "Can you keep our brand voice?",
        answer:
          "Yes. We extend your positioning into conversion copy and UX — we don't replace your creative direction.",
      },
    ],
  },
  {
    id: "tasha-beauty",
    selectorTitle: "Beauty business owner",
    selectorSubtitle: "Hair, lashes, esthetics — bookings, no-shows, and retention.",
    businessTypeLabel: "Beauty & personal care services",
    pains: [
      "The chair fills some weeks and sits empty others — social posts don't equal a full book.",
      "No-shows and last-minute cancels eat margin and morale.",
      "Clients love you in the chair but there's no systematic rebook or retail follow-up.",
    ],
    goals: [
      "Steady calendar with deposits or card-on-file where it makes sense.",
      "Automated reminders and win-back that run without you babysitting DMs.",
      "Clear packages and add-ons so average ticket climbs without hard selling.",
    ],
    headline: "Fill your book and protect your time with booking systems that stick",
    subhead:
      "You need operational relief: fewer gaps, fewer ghosts, and clients who rebook because the experience feels effortless.",
    valueProposition:
      "Ascendra ties your brand vibe to revenue mechanics — online booking flows, retention triggers, and simple automation so repeat visits aren't an accident.",
    primaryLeadMagnet: {
      label: "Start Growth Diagnosis (questionnaire)",
      href: "/diagnosis",
      blurb: "Quick structured check on where leads and retention leak — tailored to service businesses like yours.",
    },
    secondaryLeadMagnet: {
      label: "Browse free growth tools",
      href: "/free-growth-tools",
      blurb: "Calculators, blueprints, and scans you can use while you decide on a deeper build.",
    },
    primaryCta: { label: "See local business growth systems", href: "/local-business-growth" },
    secondaryCta: { label: "Book a strategy call", href: "/strategy-call" },
    recommendedService: {
      label: "Local business growth",
      href: "/local-business-growth",
      rationale: "Built for owners who live on appointments, reviews, and repeat visits.",
    },
    trustIntro: "What changes for beauty businesses",
    trustPoints: [
      "Booking UX that works on mobile first — where your clients actually live.",
      "Reminder and follow-up sequences that reduce no-shows without sounding robotic.",
      "Offer and package framing so clients understand value before they pick a time slot.",
    ],
    educationBlurb:
      "Pretty feeds attract scrolls; systems fill chairs. We connect Instagram-level presentation to calendar-level outcomes.",
    faqs: [
      {
        question: "We use a booking app already — do we replace it?",
        answer:
          "Not always. Often we improve how people reach it, what they see first, and how you follow up — sometimes that's a bigger lift than swapping software.",
      },
      {
        question: "I don't want to sound salesy to clients.",
        answer:
          "Neither do we. The goal is clarity and convenience: clients know what to book, when to show up, and why coming back is easy.",
      },
    ],
  },
  {
    id: "devon-saas",
    selectorTitle: "Early SaaS founder",
    selectorSubtitle: "MVP or early traction — you need users and validation, not just a launch page.",
    businessTypeLabel: "Early-stage SaaS / product startup",
    pains: [
      "You shipped features but signups, activations, or demos aren't compounding.",
      "Messaging tries to speak to everyone and converts no one.",
      "You're guessing which channel matters without a simple validation funnel.",
    ],
    goals: [
      "A clear ICP story, one primary conversion path, and metrics you can iterate.",
      "Lead capture and nurture that supports trials, demos, or waitlists.",
      "Enough structure to test channels without rebuilding every month.",
    ],
    headline: "Ship traction — not just another startup landing page",
    subhead:
      "Ascendra builds validation funnels: who it's for, what to do next, and the systems behind signup or demo requests.",
    valueProposition:
      "We combine product-aware copy, conversion-focused pages, and lightweight automation so you learn what pulls real users — faster than rewriting the whole stack every sprint.",
    primaryLeadMagnet: {
      label: "Startup growth kit (resource)",
      href: "/resources/startup-growth-kit",
      blurb: "Frameworks for positioning, funnel steps, and what to measure when you're pre–scale.",
    },
    secondaryLeadMagnet: {
      label: "Startup website score",
      href: "/tools/startup-website-score",
      blurb: "Fast read on whether your site matches how buyers actually evaluate early products.",
    },
    primaryCta: { label: "Explore MVP & startup web systems", href: "/startup-mvp-development" },
    secondaryCta: { label: "Book a strategy call", href: "/strategy-call" },
    recommendedService: {
      label: "Startup MVP development",
      href: "/startup-mvp-development",
      rationale: "When product, story, and acquisition need to move as one system — not three vendors.",
    },
    trustIntro: "How we help founders before PMF noise",
    trustPoints: [
      "ICP-sharp headlines and proof blocks that match skeptical early adopters.",
      "Funnel instrumentation thinking — what to track from first touch to activation.",
      "Pages and flows you can A/B without a full redesign each time.",
    ],
    educationBlurb:
      "Traction is a system: message-market fit on the page, a single primary CTA, and follow-up that doesn't depend on you manually chasing every signup.",
    faqs: [
      {
        question: "We're pre-revenue — is this overkill?",
        answer:
          "We scope for learning: smaller experiments, clearer conversion paths, and copy you can reuse across ads, email, and product onboarding.",
      },
      {
        question: "Do you replace our product team?",
        answer:
          "No. We focus on how the world meets your product — site, funnel, and automation — so your builders stay on the core product.",
      },
    ],
  },
  {
    id: "chef-food",
    selectorTitle: "Chef / food truck / food startup",
    selectorSubtitle: "Daily orders, local visibility, simple digital ordering.",
    businessTypeLabel: "Food service / mobile food / culinary brand",
    pains: [
      "Revenue swings with foot traffic, weather, or whoever saw today's story.",
      "Menus and specials change faster than the website ever does.",
      "Repeat customers aren't captured — you're re-earning the same sale daily.",
    ],
    goals: [
      "Predictable daily orders from locals who know where you are and how to order.",
      "A simple digital path: find → order → pick up / delivery handoff.",
      "Lightweight loyalty or SMS/email so regulars know the schedule and specials.",
    ],
    headline: "Make today's crowd tomorrow's regulars — with a simple order system",
    subhead:
      "You need local clarity, fast mobile UX, and repeat purchase mechanics — not enterprise restaurant software you won't use.",
    valueProposition:
      "Ascendra builds the digital side of your route: hours, location, menu clarity, and CTAs that push to order or join the list — plus automation nudges so fans don't forget you exist on slow days.",
    primaryLeadMagnet: {
      label: "Competitor position snapshot",
      href: "/competitor-position-snapshot",
      blurb: "See how you show up vs nearby options — useful when you're fighting for the same block or strip.",
    },
    secondaryLeadMagnet: {
      label: "Local business growth tools",
      href: "/local-business-growth",
      blurb: "How we think about maps, offers, and repeat visits for brick-and-mobile businesses.",
    },
    primaryCta: { label: "See local business growth systems", href: "/local-business-growth" },
    secondaryCta: { label: "Book a strategy call", href: "/strategy-call" },
    recommendedService: {
      label: "Local business growth",
      href: "/local-business-growth",
      rationale: "Same playbook we use for appointment and daily-visit businesses — tuned for local discovery.",
    },
    trustIntro: "What food businesses get from a systems build",
    trustPoints: [
      "Mobile-first menus and CTAs — thumbs, not desktops, decide your lunch rush.",
      "Clear 'where we are today' patterns for trucks and pop-ups that move.",
      "Simple capture paths (SMS, email, or loyalty) so one great meal turns into habit.",
    ],
    educationBlurb:
      "Viral clips are bonus rounds; recurring orders come from being easy to find, easy to order from, and easy to remember. That's the system we optimize.",
    caseStudyRefs: ["ssi-met-repairs", "web-development-services"],
    faqs: [
      {
        question: "We mostly use Instagram — do we still need a real site?",
        answer:
          "Yes — as the stable hub for hours, location, menu, and ordering links. Social should feed the system, not replace it.",
      },
      {
        question: "Can you integrate with our POS or delivery apps?",
        answer:
          "We map the best path from your current stack — sometimes that's deep integration, sometimes it's smart linking and tracking until volume justifies more.",
      },
    ],
  },
  {
    id: "denishia-creative",
    selectorTitle: "Creative service business",
    selectorSubtitle: "Designer or solo creative — better offers, pricing, and pipeline.",
    businessTypeLabel: "Independent creative / design services",
    pains: [
      "You're talented but underpriced — scope creep eats the margin you should keep.",
      "Prospects ghost after proposals because the value story wasn't locked before pricing.",
      "Pipeline is referral-only; when referrals pause, revenue pauses.",
    ],
    goals: [
      "Premium packages and positioning that attract clients who respect boundaries.",
      "Consistent inbound alongside referrals — without dancing for every DM.",
      "A funnel that sells the strategy before the pixel-pushing marathon.",
    ],
    headline: "Price the work you're already great at — and keep the pipeline warm",
    subhead:
      "Ascendra helps you package, position, and automate the business side so creative energy goes to delivery, not chasing vague leads.",
    valueProposition:
      "We tighten offer architecture, on-site persuasion, and follow-up systems so buyers understand ROI before they see a line-item estimate — that's how you escape underpricing without sounding corporate.",
    primaryLeadMagnet: {
      label: "Request a Digital Growth Audit",
      href: "/digital-growth-audit",
      blurb: "We audit how your site sells packages, process, and premium positioning — not just your portfolio grid.",
    },
    secondaryLeadMagnet: {
      label: "Startup Growth System offer (framework)",
      href: "/offers/startup-growth-system",
      blurb: "See how we structure growth systems end-to-end — adaptable beyond startups when you want the full picture.",
    },
    primaryCta: { label: "Book a strategy call", href: "/strategy-call" },
    secondaryCta: { label: "Upgrade marketing assets", href: "/marketing-assets" },
    recommendedService: {
      label: "Marketing assets & conversion upgrades",
      href: "/marketing-assets",
      rationale: "When your visuals are strong but the offer story and CTAs need to match your real rates.",
    },
    trustIntro: "Why creatives choose Ascendra for the business layer",
    trustPoints: [
      "Offer and package framing that respects your craft while protecting scope.",
      "Lead magnets and pages that pre-educate so sales calls start warmer.",
      "Automation for nurture and reminders so opportunities don't die in the DMs.",
    ],
    educationBlurb:
      "Your portfolio proves skill; your funnel proves business maturity. We build the second so the first converts at the rates you deserve.",
    caseStudyRefs: ["the-unauthorized-author", "web-development-services"],
    faqs: [
      {
        question: "I'm not a 'startup' — does Ascendra still fit?",
        answer:
          "Yes. The same systems — clarity, conversion, automation — apply whether you're solo or a small studio. We scale the scope to your stage.",
      },
      {
        question: "Will I sound stiff or corporate?",
        answer:
          "No. We write in your voice lane: direct, premium, human — with structure underneath so buyers know what they're buying.",
      },
    ],
  },
];

export const PERSONA_JOURNEYS_BY_ID: Record<PersonaJourneyId, PersonaJourney> = PERSONA_JOURNEYS.reduce(
  (acc, j) => {
    acc[j.id] = j;
    return acc;
  },
  {} as Record<PersonaJourneyId, PersonaJourney>
);
