export const OFFER_VALUATION_MODES = [
  "internal_tool",
  "client_tool",
  "lead_magnet",
  "paid_tool",
] as const;

export type OfferValuationMode = (typeof OFFER_VALUATION_MODES)[number];

export interface OfferValueInputs {
  dreamOutcome: number;
  perceivedLikelihood: number;
  timeDelay: number;
  effortAndSacrifice: number;
}

export interface OfferValueResult {
  rawScore: number;
  normalizedScore: number;
}

export type OfferScoreBand = "low" | "mid" | "high";

export function clampOfferInput(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(10, Math.max(1, Math.round(value)));
}

/**
 * 100M value equation:
 * (Dream Outcome * Perceived Likelihood) / (Time Delay * Effort & Sacrifice)
 *
 * Raw range is 0.01-100 for 1..10 inputs.
 * Normalization uses log scaling so:
 * - 0.01 -> 0
 * - 1.0 -> 5
 * - 100 -> 10
 */
export function calculateOfferValueScore(
  input: OfferValueInputs,
): OfferValueResult {
  const dreamOutcome = clampOfferInput(input.dreamOutcome);
  const perceivedLikelihood = clampOfferInput(input.perceivedLikelihood);
  const timeDelay = clampOfferInput(input.timeDelay);
  const effortAndSacrifice = clampOfferInput(input.effortAndSacrifice);

  const denominator = Math.max(1, timeDelay * effortAndSacrifice);
  const rawScore = (dreamOutcome * perceivedLikelihood) / denominator;
  const normalizedScore = Math.min(
    10,
    Math.max(0, ((Math.log10(rawScore) + 2) / 4) * 10),
  );

  return {
    rawScore: Number(rawScore.toFixed(4)),
    normalizedScore: Number(normalizedScore.toFixed(2)),
  };
}

export function getOfferScoreBand(score: number): OfferScoreBand {
  if (score < 5) return "low";
  if (score < 8) return "mid";
  return "high";
}

