import type { ScoreResult } from "@shared/offerEngineTypes";
import type { OfferEngineOfferTemplateRow, OfferEngineLeadMagnetTemplateRow } from "@shared/offerEngineSchema";
import type { ScoreTier } from "@shared/offerEngineConstants";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function tierFromScore(overall: number): ScoreTier {
  if (overall < 40) return "weak";
  if (overall < 62) return "fair";
  if (overall < 82) return "strong";
  return "high_potential";
}

function has(s: string | null | undefined, minLen = 12): number {
  return (s?.trim().length ?? 0) >= minLen ? 1 : 0;
}

export function scoreOfferTemplate(row: OfferEngineOfferTemplateRow): ScoreResult {
  const s = row.strategyWhyConvertJson;
  const p = row.perceivedOutcomeReviewJson;
  const f = row.funnelAlignmentJson;

  const personaClarity = has(row.personaId, 2) ? 88 : 40;
  const problemClarity = has(row.coreProblem, 20) ? 85 : 45 + 20 * has(row.coreProblem, 8);
  const outcomeClarity = has(row.desiredOutcome, 20) ? 85 : 45 + 20 * has(row.desiredOutcome, 8);
  const urgencyClarity = has(p.whyNowStatement, 15) ? 82 : 50;
  const trustStrength = has(p.trustReason, 15) ? 84 : 48;
  const promiseSpecificity = has(row.primaryPromise, 25) ? 80 : 40 + 15 * has(row.primaryPromise, 10);
  const realism =
    has(p.believabilityNotes, 10) && has(p.timeToValuePerception, 8) ? 78 : 52;
  const timeToValueClarity = has(row.timeToFirstWin, 5) ? 76 : 55;
  const frictionReduction = has(p.keyFrictionPoints, 10) ? 72 : 55;
  const ctaAlignment = has(row.funnelNextStep, 8) ? 78 : 50;
  const funnelAlignment =
    has(f.trafficSource, 4) && has(f.conversionAction, 6) && has(f.crmTaggingLogic, 8) ? 80 : 50;
  const differentiation = has(s.whyMoreBelievableThanAlternatives, 15) ? 74 : 52;
  const ploStrength = has(p.outcomeConfidenceNotes, 10) && has(p.actionConfidenceNotes, 10) ? 82 : 55;
  const nextStepClarity = has(p.actionConfidenceNotes, 12) ? 80 : 52;

  const categoryScores: Record<string, number> = {
    personaClarity,
    problemClarity,
    desiredOutcomeClarity: outcomeClarity,
    urgencyClarity,
    trustStrength,
    specificityOfPromise: promiseSpecificity,
    realismOfPromise: realism,
    timeToValueClarity,
    frictionReduction,
    ctaAlignment,
    offerToFunnelAlignment: funnelAlignment,
    differentiation,
    perceivedLikelyOutcomeStrength: ploStrength,
    nextStepClarity,
  };

  const weighted: [string, number][] = [
    ["personaClarity", 0.06],
    ["problemClarity", 0.09],
    ["desiredOutcomeClarity", 0.09],
    ["urgencyClarity", 0.06],
    ["trustStrength", 0.08],
    ["specificityOfPromise", 0.08],
    ["realismOfPromise", 0.07],
    ["timeToValueClarity", 0.06],
    ["frictionReduction", 0.05],
    ["ctaAlignment", 0.07],
    ["offerToFunnelAlignment", 0.08],
    ["differentiation", 0.06],
    ["perceivedLikelyOutcomeStrength", 0.09],
    ["nextStepClarity", 0.06],
  ];

  let overall = 0;
  for (const [key, w] of weighted) {
    overall += (categoryScores[key] ?? 50) * w;
  }
  overall = clamp(overall);

  const weaknesses: string[] = [];
  const fixes: string[] = [];
  for (const [label, val] of Object.entries(categoryScores)) {
    if (val < 58) {
      weaknesses.push(`${label.replace(/([A-Z])/g, " $1").trim()} is weak (${val})`);
      fixes.push(`Strengthen ${label}: add concrete detail tied to the selected persona.`);
    }
  }

  const tier = tierFromScore(overall);
  const biggest =
    weaknesses[0] ??
    (tier === "high_potential"
      ? "Maintain clarity as offer evolves."
      : "Overall narrative still generic — tighten problem, proof, and next step.");

  return {
    overall,
    categoryScores,
    weaknesses,
    recommendedFixes: fixes.slice(0, 8),
    tier,
    confidenceNotes:
      overall >= 75
        ? "Structure is solid for internal review; validate with a real call or landing test."
        : "Expect conversion risk until problem, promise, and funnel steps are sharper.",
    biggestConversionRisk: biggest,
    bestImprovementLever:
      categoryScores.problemClarity < categoryScores.perceivedLikelyOutcomeStrength
        ? "Sharpen the problem story before polishing copy."
        : "Deepen perceived likely outcome notes (believability + action confidence).",
  };
}

export function scoreLeadMagnetTemplate(row: OfferEngineLeadMagnetTemplateRow): ScoreResult {
  const b = row.bridgeToPaidJson;
  const p = row.perceivedOutcomeReviewJson;
  const f = row.funnelAlignmentJson;

  const personaRelevance = has(row.personaId, 2) ? 86 : 45;
  const speedQuickWin = has(row.smallQuickWin, 12) ? 84 : 48;
  const hookStrength = has(row.promiseHook, 15) ? 82 : 45;
  const promiseClarity = has(row.bigProblem, 12) ? 80 : 50;
  const trustBuilding = has(p.trustReason, 12) ? 80 : 52;
  const bridgeStrength =
    has(b.paidStepItPointsTo, 10) && has(b.whyNextStepFeelsNatural, 10) ? 84 : 45;
  const objectionReduction = has(b.objectionsReduced, 10) ? 74 : 52;
  const qualificationUsefulness = has(f.qualificationRoute, 8) ? 76 : 52;
  const valuePerception = has(row.promiseHook, 25) ? 78 : 50;
  const simplicity = has(row.ctaAfterConsumption, 6) ? 75 : 55;
  const ctaClarity = has(b.ctaShouldComeNext, 8) ? 80 : 48;
  const ploStrength = has(p.outcomeConfidenceNotes, 10) ? 80 : 52;
  const nextStepClarity = has(p.actionConfidenceNotes, 10) ? 80 : 50;

  const categoryScores: Record<string, number> = {
    personaRelevance,
    speedOfQuickWin: speedQuickWin,
    emotionalHookStrength: hookStrength,
    clarityOfPromise: promiseClarity,
    trustBuildingStrength: trustBuilding,
    bridgeToOfferStrength: bridgeStrength,
    objectionReductionValue: objectionReduction,
    qualificationUsefulness,
    valuePerception,
    simplicityOfUse: simplicity,
    ctaClarity,
    perceivedLikelyOutcomeStrength: ploStrength,
    nextStepClarity,
  };

  const weights: [string, number][] = [
    ["personaRelevance", 0.09],
    ["speedOfQuickWin", 0.1],
    ["emotionalHookStrength", 0.09],
    ["clarityOfPromise", 0.08],
    ["trustBuildingStrength", 0.08],
    ["bridgeToOfferStrength", 0.11],
    ["objectionReductionValue", 0.06],
    ["qualificationUsefulness", 0.06],
    ["valuePerception", 0.07],
    ["simplicityOfUse", 0.05],
    ["ctaClarity", 0.07],
    ["perceivedLikelyOutcomeStrength", 0.08],
    ["nextStepClarity", 0.06],
  ];

  let overall = 0;
  for (const [key, w] of weights) {
    overall += (categoryScores[key] ?? 50) * w;
  }
  overall = clamp(overall);

  const weaknesses: string[] = [];
  const fixes: string[] = [];
  for (const [label, val] of Object.entries(categoryScores)) {
    if (val < 58) {
      weaknesses.push(`${label} weak (${val})`);
      fixes.push(`Improve ${label} with persona-specific specifics.`);
    }
  }

  const tier = tierFromScore(overall);

  return {
    overall,
    categoryScores,
    weaknesses,
    recommendedFixes: fixes.slice(0, 8),
    tier,
    confidenceNotes:
      tier === "weak" || tier === "fair"
        ? "Lead magnet may underperform until bridge + quick win are unmistakable."
        : "Ready for internal QA; test headline and CTA with one real user interview.",
    biggestConversionRisk: weaknesses[0] ?? "Unclear bridge to paid offer.",
    bestImprovementLever:
      bridgeStrength < hookStrength ? "Strengthen bridge-to-offer copy and CTA" : "Sharpen hook and quick win",
  };
}

