/**
 * Default editorial / content-strategy workflow aligned to professional practice
 * (pillars, intent, SEO keyword, repurposing, governance). Merge with optional JSON
 * via ASCENDRA_CONTENT_STRATEGY_JSON — see `contentStrategyWorkflowLoader`.
 */
export type ContentStrategyPillar = {
  id: string;
  label: string;
  objective: string;
  exampleAngles?: string[];
};

export type ContentStrategyWorkflowConfig = {
  sourceDocument: {
    title: string;
    publicPath: string;
    note: string;
  };
  /** Funnel alignment note — calendar rows still use `funnelStage`; this explains how pillars map. */
  pillarFunnelBridge: string[];
  pillars: ContentStrategyPillar[];
  /** Suggested primary formats when planning (calendar `platformTargets` stays channel-specific). */
  contentFormats: { id: string; label: string; note?: string }[];
  repurposeChannels: { id: string; label: string }[];
  channelMixGuidance: string[];
  journeyStages: { stage: string; contentJob: string }[];
  proChecklists: {
    prePublish: string[];
    seoAndDiscoverability: string[];
    repurposing: string[];
    governance: string[];
  };
  assistantDirectives: string[];
};

export const CONTENT_STRATEGY_WORKFLOW_DEFAULT: ContentStrategyWorkflowConfig = {
  sourceDocument: {
    title: "Content Strategy Online (reference)",
    publicPath: "/Content%20Strategy%20Online.pdf",
    note:
      "Canonical reference PDF in `public/`. Calendar slots store a structured brief in `strategy_meta` (pillar, keyword, intent, format, lifecycle, KPI, hook, repurpose plan) alongside existing funnel, persona, and CTA fields.",
  },
  pillarFunnelBridge: [
    "Use **funnel stage** on each calendar row for Growth OS reporting; use **content pillar** in the strategy brief to cluster themes and editorial balance.",
    "A single slot can be awareness-stage video that still maps to a \"Thought leadership\" pillar — both dimensions are intentional.",
  ],
  pillars: [
    {
      id: "education",
      label: "Education & how-to",
      objective: "Build trust by teaching the problem space and repeatable methods.",
      exampleAngles: ["Tutorials", "Framework breakdowns", "Mistakes to avoid"],
    },
    {
      id: "proof",
      label: "Proof & outcomes",
      objective: "Show results, process, and credibility without pure hype.",
      exampleAngles: ["Case snapshots", "Before/after", "Process walkthrough"],
    },
    {
      id: "thought",
      label: "Point of view",
      objective: "Differentiate with a clear stance on the market and buyer decisions.",
      exampleAngles: ["Industry takes", "Contrarian clarity", "Predictions"],
    },
    {
      id: "offer",
      label: "Offer & conversion support",
      objective: "Move interested readers toward a defined next step aligned to CTA objective.",
      exampleAngles: ["Offer framing", "FAQ", "Comparison"],
    },
    {
      id: "community",
      label: "Community & culture",
      objective: "Humanize the brand and reinforce values for retention and referrals.",
      exampleAngles: ["Team stories", "Behind the scenes", "Customer spotlights"],
    },
  ],
  contentFormats: [
    { id: "long_article", label: "Long-form article / blog", note: "Pillar URL; split into snippets for social." },
    { id: "short_post", label: "Short post / thread" },
    { id: "video", label: "Video (short or long)" },
    { id: "carousel", label: "Carousel / slideshow" },
    { id: "newsletter", label: "Newsletter edition" },
    { id: "audio", label: "Audio / podcast clip" },
  ],
  repurposeChannels: [
    { id: "linkedin", label: "LinkedIn" },
    { id: "facebook", label: "Facebook / Meta" },
    { id: "email", label: "Email / newsletter" },
    { id: "blog_snippet", label: "Blog snippet / secondary post" },
    { id: "youtube_shorts", label: "Short-form video (Reels / Shorts)" },
  ],
  channelMixGuidance: [
    "Plan **one primary asset** per major idea, then schedule **repurpose targets** instead of duplicating effort.",
    "Balance **evergreen** depth with **timely** hooks; mark lifecycle on each slot so reporting stays honest.",
    "Every slot should still have persona + CTA in the main calendar fields — strategy meta does not replace those.",
  ],
  journeyStages: [
    { stage: "Awareness", contentJob: "Name the problem; earn attention without hard selling." },
    { stage: "Consideration", contentJob: "Compare approaches; show proof and evaluation criteria." },
    { stage: "Decision", contentJob: "Reduce risk; clear next step and objection handling." },
    { stage: "Retention", contentJob: "Deepen success; onboarding, tips, community moments." },
  ],
  proChecklists: {
    prePublish: [
      "Working title matches promise; hook is explicit in the brief.",
      "Primary audience (persona tags) and CTA objective are set on the row.",
      "Lifecycle chosen (evergreen vs timely) and success KPI noted.",
    ],
    seoAndDiscoverability: [
      "Primary keyword + search intent captured when the piece is meant to earn search traffic.",
      "Headline variants considered for social vs SERP.",
    ],
    repurposing: [
      "Repurpose targets listed; primary asset identified first.",
      "Scheduled follow-up slots or manual reminders for derivative posts.",
    ],
    governance: [
      "Claims and stats sourced; compliance-sensitive industries double-checked.",
      "Brand voice and disclosure norms (affiliate, sponsored) applied.",
    ],
  },
  assistantDirectives: [
    "When helping with Content Studio calendar entries, remind admins that `strategy_meta` holds the editorial strategy brief and complements `funnelStage`, `personaTags`, and `ctaObjective`.",
    "Suggest filling evergreen slots with a primary keyword and intent when SEO is a goal.",
    "Point admins to `/admin/content-studio/strategy` for pillars, checklists, and the reference PDF.",
  ],
};
