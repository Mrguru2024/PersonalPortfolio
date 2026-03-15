/**
 * Lead intent scoring based on engagement signals.
 * Updates leadScore (0–100) and intentLevel (low | moderate | high | hot).
 */

export const INTENT_LEVELS = ["low_intent", "moderate_intent", "high_intent", "hot_lead"] as const;
export type IntentLevel = (typeof INTENT_LEVELS)[number];

export interface IntentSignals {
  emailOpens: number;
  emailClicks: number;
  emailReplies: number;
  proposalViews: number;
  proposalViewTimeSeconds: number;
  pricingPageVisits: number;
  returnVisits24h: number;
  toolInteractions: number;
  formCompletions: number;
}

/**
 * Compute a 0–100 score and intent level from aggregated signals.
 */
export function computeIntentScore(signals: IntentSignals): { score: number; level: IntentLevel } {
  let score = 0;
  // Email engagement (max ~25)
  score += Math.min(signals.emailOpens * 2, 8);
  score += Math.min(signals.emailClicks * 5, 10);
  score += Math.min(signals.emailReplies * 15, 15);
  // Proposal engagement (max ~30)
  score += Math.min(signals.proposalViews * 8, 15);
  if (signals.proposalViews >= 2) score += 5;
  score += Math.min(Math.floor(signals.proposalViewTimeSeconds / 60) * 2, 10);
  // Site behavior (max ~25)
  score += Math.min(signals.pricingPageVisits * 5, 10);
  score += Math.min(signals.returnVisits24h * 5, 8);
  score += Math.min(signals.toolInteractions * 2, 5);
  score += Math.min(signals.formCompletions * 5, 10);
  score = Math.min(100, Math.max(0, score));

  let level: IntentLevel = "low_intent";
  if (score >= 70) level = "hot_lead";
  else if (score >= 45) level = "high_intent";
  else if (score >= 20) level = "moderate_intent";

  return { score, level };
}

export function intentLevelLabel(level: string | null | undefined): string {
  if (!level) return "—";
  const labels: Record<string, string> = {
    low_intent: "Low Intent",
    moderate_intent: "Moderate Intent",
    high_intent: "High Intent",
    hot_lead: "Hot Lead",
  };
  return labels[level] ?? level;
}
