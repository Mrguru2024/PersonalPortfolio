/**
 * Outcome-oriented framing for the 3-step growth system (Diagnose → Build → Scale).
 * Used in client portal and public preview — not guarantees; see disclaimer constant.
 */
export const GROWTH_SYSTEM_STEP_OUTCOMES: Record<1 | 2 | 3, string> = {
  1: "We show you exactly why you're not getting consistent jobs.",
  2: "We install a system that brings in real leads and books them.",
  3: "We turn on traffic and double down on what actually makes you money.",
};

/** Typical aims we design toward — not promises. */
export const GROWTH_SYSTEM_EXPECTED_OUTCOME_BULLETS: readonly string[] = [
  "More booked jobs, not just calls",
  "Less time wasted on low-quality customers",
  "A system that works even when you're not posting",
];

export const GROWTH_SYSTEM_RESULTS_DISCLAIMER =
  "Results aren't guaranteed—they depend on your market, offer, and how consistently you run the system. We frame expected outcomes clearly; we don't promise specific numbers or timelines.";
