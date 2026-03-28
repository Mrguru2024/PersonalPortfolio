import type {
  OfferValuationBand,
  OfferValuationInsights,
  OfferValuationRecommendation,
} from "@shared/schema";

export interface OfferValuationInput {
  persona: string;
  offerName: string;
  description?: string | null;
  dreamOutcomeScore: number;
  likelihoodScore: number;
  timeDelayScore: number;
  effortScore: number;
}

export interface OfferValuationResult {
  rawScore: number;
  finalScore: number;
  insights: OfferValuationInsights;
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(10, Math.round(n)));
}

function toBand(finalScore: number): OfferValuationBand {
  if (finalScore < 5) return "low";
  if (finalScore < 8) return "mid";
  return "high";
}

function rankRecommendations(input: OfferValuationInput): OfferValuationRecommendation[] {
  const recs: OfferValuationRecommendation[] = [];

  if (input.dreamOutcomeScore <= 6) {
    recs.push({
      area: "dream_outcome",
      title: "Outcome reframing is needed",
      action:
        "Lead with one concrete end-state your buyer already wants and quantify it (time saved, revenue added, risk removed).",
      priority: input.dreamOutcomeScore <= 4 ? "high" : "medium",
    });
  }

  if (input.likelihoodScore <= 6) {
    recs.push({
      area: "likelihood",
      title: "Trust stack needs stronger proof",
      action:
        "Add proof by stage: case study, before/after examples, implementation roadmap, and a risk-reversal guarantee.",
      priority: input.likelihoodScore <= 4 ? "high" : "medium",
    });
  }

  if (input.timeDelayScore >= 6) {
    recs.push({
      area: "time_delay",
      title: "Time-to-value is too slow",
      action:
        "Ship a fast-start path: onboarding in <48 hours, milestone checkpoints, and an immediate first win in week one.",
      priority: input.timeDelayScore >= 8 ? "high" : "medium",
    });
  }

  if (input.effortScore >= 6) {
    recs.push({
      area: "effort",
      title: "Perceived effort is too high",
      action:
        "Reduce customer workload with templates, done-with-you setup, automation, and optional done-for-you add-ons.",
      priority: input.effortScore >= 8 ? "high" : "medium",
    });
  }

  if (recs.length === 0) {
    recs.push({
      area: "dream_outcome",
      title: "Value stack is strong — amplify distribution",
      action:
        "Keep the current offer structure and increase reach with persona-specific messaging variants and stronger channel targeting.",
      priority: "low",
    });
  }

  return recs.sort((a, b) => {
    const weight = { high: 3, medium: 2, low: 1 } as const;
    return weight[b.priority] - weight[a.priority];
  });
}

function buildStrengths(input: OfferValuationInput): string[] {
  const strengths: string[] = [];
  if (input.dreamOutcomeScore >= 8) strengths.push("Strong dream outcome promise.");
  if (input.likelihoodScore >= 8) strengths.push("High confidence signal from buyer perspective.");
  if (input.timeDelayScore <= 4) strengths.push("Fast expected time-to-value.");
  if (input.effortScore <= 4) strengths.push("Low effort burden for the customer.");
  if (strengths.length === 0) strengths.push("Core structure is in place and can be improved with targeted refinements.");
  return strengths;
}

function buildWeaknesses(input: OfferValuationInput): string[] {
  const weaknesses: string[] = [];
  if (input.dreamOutcomeScore <= 6) weaknesses.push("Outcome promise is not yet specific or compelling enough.");
  if (input.likelihoodScore <= 6) weaknesses.push("Offer lacks enough trust signals and certainty.");
  if (input.timeDelayScore >= 6) weaknesses.push("Perceived delay to results lowers urgency.");
  if (input.effortScore >= 6) weaknesses.push("Offer asks for too much customer effort.");
  if (weaknesses.length === 0) weaknesses.push("No material weaknesses detected at current scoring profile.");
  return weaknesses;
}

function buildUpgradeSuggestions(
  input: OfferValuationInput,
  band: OfferValuationBand,
): OfferValuationInsights["upgradeSuggestions"] {
  const personaLabel = input.persona?.trim() || "your target customer";
  const offer = input.offerName?.trim() || "your offer";

  const suggestedBonuses = [
    input.timeDelayScore >= 6
      ? "Quick-start onboarding sprint with milestone map"
      : "90-day growth roadmap with weekly checkpoints",
    input.likelihoodScore <= 6
      ? "Case-study vault with real before/after wins"
      : "Advanced implementation playbook",
    input.effortScore >= 6
      ? "Done-for-you setup and automation templates"
      : "Execution tracker and KPI dashboard",
  ];

  const suggestedGuarantee =
    input.likelihoodScore <= 6
      ? "Results milestone guarantee: if key milestone is not reached by the agreed checkpoint, receive extended implementation support at no extra cost."
      : "Execution confidence guarantee: if onboarding deliverables are not shipped on timeline, receive a service credit and priority support.";

  const outcomeAngle =
    input.dreamOutcomeScore <= 6
      ? "clear, measurable business outcome"
      : "faster and more predictable growth outcome";

  const improvedOfferWording =
    band === "low"
      ? `${offer} helps ${personaLabel} remove growth bottlenecks by delivering one measurable win in the first phase, then scaling with structured implementation support.`
      : band === "mid"
        ? `${offer} gives ${personaLabel} a clear roadmap, faster time-to-value, and stronger confidence through proof, milestones, and guided execution.`
        : `${offer} helps ${personaLabel} compound wins quickly through a high-certainty process, low-friction delivery, and repeatable performance milestones.`;

  return {
    positioningStatement: `${offer} is the fastest path for ${personaLabel} to achieve a ${outcomeAngle} without unnecessary complexity.`,
    improvedOfferWording,
    suggestedBonuses,
    suggestedGuarantee,
  };
}

function buildSummary(band: OfferValuationBand, finalScore: number): string {
  if (band === "low") {
    return `Current offer value is underpowered at ${finalScore}/10. Prioritize strengthening perceived outcome and certainty while reducing delay and effort friction.`;
  }
  if (band === "mid") {
    return `Offer value is moderate at ${finalScore}/10. The foundation is viable, but targeted trust and speed improvements can move this into a stronger conversion range.`;
  }
  return `Offer value is strong at ${finalScore}/10. Preserve the core value stack and optimize message-channel fit to scale conversions.`;
}

export function calculateOfferValuation(input: OfferValuationInput): OfferValuationResult {
  const dreamOutcomeScore = clampScore(input.dreamOutcomeScore);
  const likelihoodScore = clampScore(input.likelihoodScore);
  const timeDelayScore = clampScore(input.timeDelayScore);
  const effortScore = clampScore(input.effortScore);

  const numerator = dreamOutcomeScore * likelihoodScore;
  const denominator = Math.max(1, timeDelayScore * effortScore);
  const rawScore = numerator / denominator;

  // Normalizes the 0.01..100 ratio range into 0..10 using log scale for practical spread.
  const normalized = ((Math.log10(rawScore) + 2) / 4) * 10;
  const finalScore = Math.max(0, Math.min(10, Number(normalized.toFixed(2))));
  const band = toBand(finalScore);

  const normalizedInput: OfferValuationInput = {
    ...input,
    dreamOutcomeScore,
    likelihoodScore,
    timeDelayScore,
    effortScore,
  };

  const insights: OfferValuationInsights = {
    band,
    summary: buildSummary(band, finalScore),
    strengths: buildStrengths(normalizedInput),
    weaknesses: buildWeaknesses(normalizedInput),
    strategicRecommendations: rankRecommendations(normalizedInput),
    upgradeSuggestions: buildUpgradeSuggestions(normalizedInput, band),
  };

  return {
    rawScore: Number(rawScore.toFixed(4)),
    finalScore,
    insights,
  };
}
