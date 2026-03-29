/**
 * Copy for /admin/how-to/experiments — interactive tutorial + read-aloud source of truth.
 * Keep aligned with Ascendra Experimentation Engine (AEE) implementation.
 */

export type TutorialChecklistItem = {
  id: string;
  label: string;
  /** Short hint shown under checkbox */
  hint: string;
};

export const EXPERIMENTS_TUTORIAL_CHECKLIST: TutorialChecklistItem[] = [
  {
    id: "hypothesis",
    label: "Write one clear hypothesis (what changes, what metric should move, for whom).",
    hint: "Example: “If the hero headline stresses speed, more visitors will book a demo.”",
  },
  {
    id: "create-draft",
    label: "Create a draft experiment with control + at least one variant and allocation weights.",
    hint: "Use `/admin/experiments/new`. Variants are stored in `growth_variants`.",
  },
  {
    id: "key-stable",
    label: "Keep the experiment key stable before you send real traffic — it is used for assignment and reporting.",
    hint: "The technical key is shown on the recap and detail page; changing it mid-flight breaks continuity.",
  },
  {
    id: "running",
    label: "Set status to running only when the site or channel is ready to split traffic.",
    hint: "Rollups in `aee_experiment_metrics_daily` accumulate while the test is active.",
  },
  {
    id: "assignment",
    label: "Wire the public variant endpoint on pages or apps that should participate.",
    hint: "`GET /api/growth-intelligence/variant?experiment=KEY&visitorId=...` returns `variantKey` and `config`.",
  },
  {
    id: "rollups",
    label: "Open the experiment detail page and confirm visitors and leads in the rollups table.",
    hint: "Totals use dimension_key `total` on daily metric rows.",
  },
  {
    id: "calculator",
    label: "Copy visitor and conversion counts into the A/B calculator on the overview for a z-test readout.",
    hint: "The overview calculator uses a pooled two-proportion z-test — confirm important decisions with your own process.",
  },
  {
    id: "recommendations",
    label: "Read Optimization preview — it flags thin samples (about 20 visitors or first lead per variant).",
    hint: "Heuristics only, not a substitute for power analysis or Bayesian methods.",
  },
  {
    id: "channels",
    label: "Add channel links when PPC or email should show up next to the experiment.",
    hint: "Detail page: link Google/Meta campaigns, email, web paths to close the loop visually.",
  },
  {
    id: "ai-insights",
    label: "Optional: run Content & campaign AI insights with your goal and optional email stats.",
    hint: "Requires `OPENAI_API_KEY`; the model is instructed to use only the numbers you see on the page.",
  },
  {
    id: "decide",
    label: "Decide: ship winner, iterate, or pause — document rationale in the experiment record if your team tracks that.",
    hint: "Experiment score and AI text are previews; align with CRM revenue and ad platform data.",
  },
];

export const EXPERIMENTS_TUTORIAL_STORAGE_KEY = "ascendra-aee-tutorial-checklist-v1";

/** Full plain text for Read aloud button (no markdown). */
export function getExperimentsTutorialReadAloudText(): string {
  const intro = `
Ascendra interactive guide: A-B testing and the Revenue experiments admin tools.

The Ascendra Experimentation Engine stores experiments in growth experiments and growth variants.
Daily rollups live in aee experiment metrics daily with dimension key total.
Visitors get a variant from the public API: GET slash api slash growth-intelligence slash variant with query parameters experiment and visitor id.

The overview at slash admin slash experiments has a workflow card, an A-B calculator using a two-proportion z-test on pooled variance, advanced tools, and the experiment list.
Use slash admin slash experiments slash new to create tests. Reports and patterns are under their sub-navigation links.
Each experiment detail page shows channel links, optional paid campaign totals, experiment score, rule-based recommendations, an AI insights panel if Open A I is configured, variant table, rollups, and stored insights.

Before trusting winners, wait for enough traffic: the app suggests about twenty visitors per variant or at least one lead before promoting a leader.

Checklist items you can complete in the interactive page: write a hypothesis, create drafts, keep keys stable, set running when live, wire the variant endpoint, verify rollups, use the calculator, read recommendations, add channel links, optionally generate AI insights, and record a decision.
`.replace(/\s+/g, " ").trim();

  const scenarios = `
Example scenarios. Landing: change hero headline or C-A-T-A button text; measure demo bookings or form submits.
Email: subject line or preview text test; paste open and click rates into the AI insights optional fields.
Paid: creative or landing pairing; link the campaign in channel links and compare with rollups plus ad platform conversions.
`;

  const checklist = EXPERIMENTS_TUTORIAL_CHECKLIST.map((c) => `${c.label} ${c.hint}`).join(" ");

  return [intro, scenarios, checklist].join("\n\n");
}
