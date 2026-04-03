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

/** Unified 0–100 scale label (Hormozi-style bands on top of the existing log-normalized 0–10 score). */
export type ValueEquationRating = "Weak" | "Average" | "Strong" | "Dominant";

export interface ValueEquationAnalysis {
  rawScore: number;
  /** Log-scaled 0–10 (unchanged — used across existing offer valuation UI). */
  normalizedScore: number;
  /** Same score on a 0–100 scale (`normalizedScore * 10`, monotonic with legacy displays). */
  normalizedScore100: number;
  rating: ValueEquationRating;
  /** Short factual reads on each lever. */
  diagnostics: string[];
  improvementSuggestions: string[];
}

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

/** Map legacy 0–10 normalized score to 0–100 (linear; preserves ordering vs raw equation). */
export function normalizedValueScoreTo100(normalizedScore: number): number {
  if (!Number.isFinite(normalizedScore)) return 0;
  return Number(Math.min(100, Math.max(0, normalizedScore * 10)).toFixed(2));
}

export function valueEquationRatingFrom100(normalizedScore100: number): ValueEquationRating {
  if (!Number.isFinite(normalizedScore100)) return "Weak";
  if (normalizedScore100 < 50) return "Weak";
  if (normalizedScore100 < 70) return "Average";
  if (normalizedScore100 < 85) return "Strong";
  return "Dominant";
}

function diagnosticForLever(
  key: keyof OfferValueInputs,
  value: number,
): string {
  const v = clampOfferInput(value);
  if (key === "dreamOutcome") {
    return v <= 4
      ? "Dream outcome (1–10): reads weak — buyers may not feel a must-have end state."
      : v <= 7
        ? "Dream outcome: acceptable but could be sharper or more specific."
        : "Dream outcome: strong desire-driven framing.";
  }
  if (key === "perceivedLikelihood") {
    return v <= 4
      ? "Perceived likelihood: trust/proof likely too thin for confident buyers."
      : v <= 7
        ? "Perceived likelihood: moderate; add concrete proof and de-risking."
        : "Perceived likelihood: buyers can believe they will get the result.";
  }
  if (key === "timeDelay") {
    return v >= 8
      ? "Time delay: feels slow — urgency and time-to-value are conversion drag."
      : v >= 5
        ? "Time delay: acceptable; a faster first win would lift conversions."
        : "Time delay: fast path to value is clear.";
  }
  return v >= 8
    ? "Effort & sacrifice: feels heavy — simplify onboarding and delivered work."
    : v >= 5
      ? "Effort & sacrifice: moderate friction; reduce steps and cognitive load."
      : "Effort & sacrifice: feels doable for the buyer.";
}

function suggestionsForInputs(input: OfferValueInputs): string[] {
  const i = {
    dreamOutcome: clampOfferInput(input.dreamOutcome),
    perceivedLikelihood: clampOfferInput(input.perceivedLikelihood),
    timeDelay: clampOfferInput(input.timeDelay),
    effortAndSacrifice: clampOfferInput(input.effortAndSacrifice),
  };
  const out: string[] = [];

  if (i.dreamOutcome <= 6) {
    out.push(
      "Tighten the dream outcome: one measurable end state, one timeline, one persona-specific pain it removes.",
    );
  }
  if (i.perceivedLikelihood <= 6) {
    out.push(
      "Stack believability: proof timeline, process transparency, and a scoped risk-reversal that matches what you can honor.",
    );
  }
  if (i.timeDelay >= 6) {
    out.push(
      "Compress time-to-value: define a first win in the first 7–14 days and put it in the headline and onboarding.",
    );
  }
  if (i.effortAndSacrifice >= 6) {
    out.push(
      "Cut perceived effort: templates, done-with-you setup, or a DFY wedge so the buyer does less mental work.",
    );
  }

  if (out.length === 0) {
    out.push(
      "Pressure-test message-market fit: run a short landing test on one channel before scaling spend.",
    );
  }
  return out.slice(0, 8);
}

/**
 * Single entry for value equation: raw + 0–10 + 0–100 + Hormozi-style rating + diagnostics.
 * Formula unchanged from `calculateOfferValueScore` (100M / value equation).
 */
export function analyzeValueEquation(input: OfferValueInputs): ValueEquationAnalysis {
  const clamped: OfferValueInputs = {
    dreamOutcome: clampOfferInput(input.dreamOutcome),
    perceivedLikelihood: clampOfferInput(input.perceivedLikelihood),
    timeDelay: clampOfferInput(input.timeDelay),
    effortAndSacrifice: clampOfferInput(input.effortAndSacrifice),
  };
  const { rawScore, normalizedScore } = calculateOfferValueScore(clamped);
  const normalizedScore100 = normalizedValueScoreTo100(normalizedScore);
  const rating = valueEquationRatingFrom100(normalizedScore100);
  const diagnostics: string[] = [
    diagnosticForLever("dreamOutcome", clamped.dreamOutcome),
    diagnosticForLever("perceivedLikelihood", clamped.perceivedLikelihood),
    diagnosticForLever("timeDelay", clamped.timeDelay),
    diagnosticForLever("effortAndSacrifice", clamped.effortAndSacrifice),
    `Composite: raw equation ${rawScore.toFixed(2)} → normalized ${normalizedScore.toFixed(2)}/10 (${normalizedScore100}/100), rated ${rating}.`,
  ];
  const improvementSuggestions = suggestionsForInputs(clamped);

  return {
    rawScore,
    normalizedScore,
    normalizedScore100,
    rating,
    diagnostics,
    improvementSuggestions,
  };
}

