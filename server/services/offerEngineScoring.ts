import type {
  ScoreResult,
  ValueEquationResult,
  GrandSlamOfferResult,
  OfferGradeResult,
  LeadMagnetBuilderResult,
  LeadMagnetGradeResult,
} from "@shared/offerEngineTypes";
import type { OfferEngineOfferTemplateRow, OfferEngineLeadMagnetTemplateRow } from "@shared/offerEngineSchema";
import type { ScoreTier } from "@shared/offerEngineConstants";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clampFloat(n: number, min = 0, max = 100): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
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

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function splitIdeas(value: string | null | undefined): string[] {
  const txt = normalizeText(value);
  if (!txt) return [];
  return txt
    .split(/\n|•|- /g)
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseHintedNumber(value: string | null | undefined): number | null {
  const txt = normalizeText(value).toLowerCase();
  if (!txt) return null;
  const m = txt.match(/(\d+(\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  if (txt.includes("week")) return n * 7;
  if (txt.includes("month")) return n * 30;
  if (txt.includes("year")) return n * 365;
  if (txt.includes("day")) return n;
  return n;
}

function valueEquationRating(score: number): ValueEquationResult["rating"] {
  if (score < 35) return "Weak";
  if (score < 58) return "Average";
  if (score < 78) return "Strong";
  return "Dominant";
}

function buildValueEquation(row: OfferEngineOfferTemplateRow): ValueEquationResult {
  const desiredOutcomeStrength = 2 + 4 * has(row.desiredOutcome, 18) + 2 * has(row.primaryPromise, 18);
  const dreamOutcome = clampFloat(desiredOutcomeStrength, 1, 10);

  const trustSignals =
    2 +
    3 * has(row.perceivedOutcomeReviewJson.trustReason, 12) +
    2 * has(row.perceivedOutcomeReviewJson.believabilityNotes, 10) +
    3 * has(row.perceivedOutcomeReviewJson.outcomeConfidenceNotes, 10);
  const perceivedLikelihood = clampFloat(trustSignals, 1, 10);

  const hintedDelayDays = parseHintedNumber(row.timeToFirstWin) ?? parseHintedNumber(row.perceivedOutcomeReviewJson.timeToValuePerception);
  const timeDelay =
    hintedDelayDays == null ? 5
    : hintedDelayDays <= 7 ? 2
    : hintedDelayDays <= 21 ? 3.5
    : hintedDelayDays <= 45 ? 5
    : hintedDelayDays <= 90 ? 7
    : 8.5;

  const effortSignals =
    2 +
    3 * has(row.perceivedOutcomeReviewJson.effortPerception, 8) +
    3 * has(row.perceivedOutcomeReviewJson.keyFrictionPoints, 10) +
    2 * has(row.strategyWhyConvertJson.frictionThatStillExists, 8);
  const effort = clampFloat(effortSignals, 1.5, 10);

  const rawScore = (dreamOutcome * perceivedLikelihood) / (Math.max(1, timeDelay) * Math.max(1, effort));
  const normalizedScore = clamp(
    (Math.log(clampFloat(rawScore, 0, 100) + 1) / Math.log(101)) * 100,
  );

  const diagnostics: string[] = [
    `Dream outcome strength ${dreamOutcome.toFixed(1)}/10`,
    `Perceived likelihood ${perceivedLikelihood.toFixed(1)}/10`,
    `Time delay factor ${timeDelay.toFixed(1)}/10`,
    `Effort factor ${effort.toFixed(1)}/10`,
  ];
  if (desiredOutcomeStrength < 6) diagnostics.push("Desired transformation is too vague.");
  if (trustSignals < 6) diagnostics.push("Believability is weak; trust and proof are underdeveloped.");
  if ((hintedDelayDays ?? 999) > 60) diagnostics.push("Time-to-value appears long for first conversion.");
  if (effort > 6.5) diagnostics.push("Offer feels effort-heavy; reduce activation burden.");

  const improvementSuggestions: string[] = [];
  if (dreamOutcome < 6) {
    improvementSuggestions.push("Tighten dream outcome: define one measurable before/after transformation.");
  }
  if (perceivedLikelihood < 6.5) {
    improvementSuggestions.push("Increase perceived likelihood with proof, mechanism clarity, and concrete case credibility.");
  }
  if (timeDelay > 5) {
    improvementSuggestions.push("Shrink time delay by adding a first-win milestone within 7–21 days.");
  }
  if (effort > 5.5) {
    improvementSuggestions.push("Reduce effort by pre-building templates, checklists, or done-for-you onboarding steps.");
  }
  if (!improvementSuggestions.length) {
    improvementSuggestions.push("Validate score with live funnel data before scaling acquisition.");
  }

  return {
    rawScore: Number(rawScore.toFixed(2)),
    normalizedScore,
    rating: valueEquationRating(normalizedScore),
    diagnostics,
    improvementSuggestions,
  };
}

function buildGrandSlamOffer(row: OfferEngineOfferTemplateRow): GrandSlamOfferResult {
  const strategy = row.strategyWhyConvertJson;
  const deliverables = splitIdeas(row.tangibleDeliverables);
  const bonuses = Array.isArray(strategy.bonusIdeas) ? strategy.bonusIdeas.filter(Boolean) : [];
  const guarantees = Array.isArray(strategy.guaranteeIdeas) ? strategy.guaranteeIdeas.filter(Boolean) : [];
  const urgency = splitIdeas(strategy.urgencyPlan);
  const scarcity = splitIdeas(strategy.scarcityPlan);
  const proof = splitIdeas(strategy.proofCredibilityFactors ?? strategy.reasonToBelieve);

  const riskReversalScore = clamp(
    30 +
      (row.riskReversalStyle === "none" ? 0 : 25) +
      (guarantees.length > 0 ? 20 : 0) +
      (has(strategy.reasonToBelieve, 12) ? 15 : 0),
  );
  const perceivedValueScore = clamp(
    25 +
      (deliverables.length >= 3 ? 20 : deliverables.length * 6) +
      (bonuses.length >= 2 ? 15 : bonuses.length * 6) +
      (proof.length >= 2 ? 15 : proof.length * 5) +
      (has(row.primaryPromise, 20) ? 15 : 0) +
      (has(strategy.pricingValueJustification, 12) ? 10 : 0),
  );
  const clarityScore = clamp(
    30 +
      (has(row.coreProblem, 18) ? 15 : 0) +
      (has(row.desiredOutcome, 18) ? 15 : 0) +
      (has(strategy.easeOfUnderstandingNotes, 12) ? 15 : 0) +
      (has(row.funnelNextStep, 10) ? 15 : 0),
  );
  const differentiationScore = clamp(
    25 +
      (has(strategy.currentAlternativesInMarket, 12) ? 15 : 0) +
      (has(strategy.whyMoreBelievableThanAlternatives, 12) ? 25 : 0) +
      (proof.length > 0 ? 15 : 0) +
      (has(strategy.marketSophisticationLevel, 8) ? 10 : 0),
  );

  const recommendations: string[] = [];
  if (bonuses.length < 2) recommendations.push("Add at least two specific bonuses that reduce implementation friction.");
  if (guarantees.length === 0) recommendations.push("Define a scoped guarantee or milestone-based confidence policy.");
  if (clarityScore < 65) recommendations.push("Simplify the offer into a one-line transformation plus one primary CTA.");
  if (differentiationScore < 60) recommendations.push("Call out how this beats default alternatives in the market.");
  if (perceivedValueScore < 65) recommendations.push("Increase value stack: core deliverables + proof + bonus sequencing.");
  if (!recommendations.length) recommendations.push("Offer stack is solid; test variants by traffic temperature.");

  const offerSummary = [
    row.name,
    row.offerType.replace(/_/g, " "),
    `for persona ${row.personaId}`,
    row.primaryPromise ? `— ${row.primaryPromise}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    offerSummary,
    stackBreakdown: {
      coreOffer: deliverables.length ? deliverables : [normalizeText(row.primaryPromise) || "Core offer promise not defined"],
      bonuses,
      guarantees,
      urgency,
      scarcity,
      proof,
    },
    riskReversalScore,
    perceivedValueScore,
    clarityScore,
    differentiationScore,
    recommendations,
  };
}

function buildOfferGrade(row: OfferEngineOfferTemplateRow, valueEquation: ValueEquationResult, grandSlam: GrandSlamOfferResult): OfferGradeResult {
  const demandStrength = clamp(45 + 20 * has(row.coreProblem, 16) + 15 * has(row.desiredOutcome, 18));
  const competitionSaturation = clamp(25 + 20 * has(row.strategyWhyConvertJson.currentAlternativesInMarket, 12));
  const pricingVsValue = clamp(40 + 20 * has(row.strategyWhyConvertJson.pricingValueJustification, 12) + 15 * has(row.pricingModel, 4));
  const personaRelevance = clamp(50 + 25 * has(row.strategyWhyConvertJson.whyPersonaCares, 10));
  const urgencyStrength = clamp(35 + 25 * has(row.strategyWhyConvertJson.urgencyPlan, 8) + 15 * has(row.perceivedOutcomeReviewJson.whyNowStatement, 10));
  const proofStrength = clamp(30 + 25 * has(row.strategyWhyConvertJson.proofCredibilityFactors, 10) + 20 * has(row.perceivedOutcomeReviewJson.trustReason, 10));
  const guaranteeStrength = grandSlam.riskReversalScore;
  const bonusStrength = clamp(20 + grandSlam.stackBreakdown.bonuses.length * 15);
  const salesFriction = clamp(70 - (25 * has(row.funnelAlignmentJson.followUpAction, 8) + 20 * has(row.funnelAlignmentJson.qualificationRoute, 8)));
  const funnelReadiness = clamp(
    35 +
      15 * has(row.funnelAlignmentJson.trafficSource, 6) +
      15 * has(row.funnelAlignmentJson.crmTaggingLogic, 8) +
      15 * has(row.funnelAlignmentJson.salesHandoffLogic, 8),
  );
  const offerMessageMatch = clamp(40 + 20 * has(row.primaryPromise, 18) + 20 * has(row.strategyWhyConvertJson.whyTheyCareNow, 10));

  const overallScore = clamp(
    demandStrength * 0.1 +
      (100 - competitionSaturation) * 0.06 +
      grandSlam.differentiationScore * 0.1 +
      grandSlam.clarityScore * 0.1 +
      pricingVsValue * 0.09 +
      personaRelevance * 0.09 +
      urgencyStrength * 0.07 +
      proofStrength * 0.08 +
      guaranteeStrength * 0.08 +
      bonusStrength * 0.05 +
      (100 - salesFriction) * 0.06 +
      funnelReadiness * 0.06 +
      offerMessageMatch * 0.06,
  );

  const marketFit: OfferGradeResult["marketFit"] =
    overallScore < 50 ? "Poor"
    : overallScore < 72 ? "Moderate"
    : "Strong";
  const conversionProbability = clamp(
    overallScore * 0.7 +
      valueEquation.normalizedScore * 0.3 -
      (salesFriction > 60 ? 8 : 0),
  );
  const readinessStatus: OfferGradeResult["readinessStatus"] =
    overallScore < 55 ? "Not Ready"
    : overallScore < 74 ? "Needs Work"
    : "Launch Ready";

  const weaknessPairs: Array<[string, number, string]> = [
    ["Market demand signal", demandStrength, "Sharpen the pain/problem narrative with evidence from live discovery calls."],
    ["Differentiation", grandSlam.differentiationScore, "State why this is superior to current alternatives in one sentence."],
    ["Clarity", grandSlam.clarityScore, "Simplify promise + path so a cold lead understands it in under 10 seconds."],
    ["Pricing vs value", pricingVsValue, "Add explicit value-to-price rationale anchored to outcomes."],
    ["Proof", proofStrength, "Add concrete proof and reason-to-believe assets."],
    ["Guarantee", guaranteeStrength, "Introduce scoped risk reversal to lower perceived risk."],
    ["Funnel readiness", funnelReadiness, "Define traffic source, CRM tags, and sales handoff before launch."],
  ];
  const ranked = weaknessPairs.sort((a, b) => a[1] - b[1]).slice(0, 4);

  return {
    overallScore,
    marketFit,
    conversionProbability,
    topWeaknesses: ranked.map(([label, score]) => `${label} (${score}/100)`),
    fixActions: ranked.map(([, , fix]) => fix),
    readinessStatus,
  };
}

function buildLeadMagnetBuilder(row: OfferEngineLeadMagnetTemplateRow): LeadMagnetBuilderResult {
  const bridge = row.bridgeToPaidJson;
  const hookStrengthScore = clamp(
    25 +
      30 * has(row.promiseHook, 14) +
      20 * has(row.bigProblem, 12),
  );
  const specificityScore = clamp(
    25 +
      20 * has(row.smallQuickWin, 10) +
      20 * has(bridge.specificityLevel, 8) +
      20 * has(row.ctaAfterConsumption, 8),
  );
  const valueDensityScore = clamp(
    30 +
      20 * has(row.smallQuickWin, 10) +
      20 * has(bridge.valueDensity, 6) +
      15 * has(bridge.helpsPersonaUnderstand, 10),
  );
  const nextStepAlignmentScore = clamp(
    30 +
      25 * has(bridge.ctaShouldComeNext, 8) +
      25 * has(bridge.intendedNextStep, 8),
  );
  const offerAlignmentScore = clamp(
    30 +
      20 * (row.relatedOfferTemplateId ? 1 : 0) +
      20 * has(bridge.paidStepItPointsTo, 8) +
      15 * has(bridge.whyNextStepFeelsNatural, 10),
  );
  const trafficFitScore = clamp(
    25 +
      20 * has(row.funnelAlignmentJson.audienceTemperature, 4) +
      20 * has(row.funnelAlignmentJson.trafficSource, 4) +
      15 * has(bridge.awarenessLevel, 6),
  );

  const weaknesses: string[] = [];
  if (hookStrengthScore < 60) weaknesses.push("Hook is weak or generic for the persona.");
  if (specificityScore < 60) weaknesses.push("Promise/quick win lacks specificity.");
  if (offerAlignmentScore < 60) weaknesses.push("Lead magnet does not clearly bridge to a paid step.");
  if (trafficFitScore < 60) weaknesses.push("Traffic temperature and magnet complexity appear mismatched.");
  if (nextStepAlignmentScore < 60) weaknesses.push("Next-step CTA flow is not explicit.");

  const recommendations: string[] = [];
  if (hookStrengthScore < 65) recommendations.push("Rewrite the hook using a specific pain + measurable micro-win.");
  if (specificityScore < 65) recommendations.push("Replace vague claims with named deliverables and concrete outcomes.");
  if (offerAlignmentScore < 65) recommendations.push("Attach this magnet to a specific offer and define the exact handoff step.");
  if (trafficFitScore < 65) recommendations.push("For cold traffic, simplify the ask and reduce cognitive load.");
  if (nextStepAlignmentScore < 65) recommendations.push("Clarify CTA sequence: consume -> next action -> qualification route.");
  if (!recommendations.length) recommendations.push("Lead magnet is strategically coherent; validate with opt-in quality data.");

  const leadMagnetSummary = [
    row.name,
    `(${row.leadMagnetType})`,
    row.promiseHook ? `— ${row.promiseHook}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    leadMagnetSummary,
    hookStrengthScore,
    specificityScore,
    valueDensityScore,
    nextStepAlignmentScore,
    offerAlignmentScore,
    trafficFitScore,
    weaknesses,
    recommendations,
  };
}

function buildLeadMagnetGrade(builder: LeadMagnetBuilderResult, row: OfferEngineLeadMagnetTemplateRow): LeadMagnetGradeResult {
  const clarity = clamp(30 + 25 * has(row.promiseHook, 12) + 20 * has(row.bigProblem, 10));
  const specificity = builder.specificityScore;
  const relevance = clamp(35 + 30 * has(row.bigProblem, 10) + 20 * has(row.smallQuickWin, 10));
  const offerAlignment = builder.offerAlignmentScore;
  const funnelFit = clamp(35 + 20 * has(row.funnelAlignmentJson.qualificationRoute, 8) + 20 * has(row.funnelAlignmentJson.finalConversionGoal, 8));
  const ctaStrength = clamp(30 + 25 * has(row.ctaAfterConsumption, 8) + 20 * has(row.bridgeToPaidJson.ctaShouldComeNext, 8));
  const easeOfConsumption = clamp(35 + 20 * has(row.bridgeToPaidJson.easeOfConsumption, 6) + 10 * has(row.format, 3));
  const perceivedUsefulness = builder.valueDensityScore;
  const personaMatch = clamp(40 + 25 * has(row.personaId, 2) + 20 * has(row.bridgeToPaidJson.messageAngle, 6));
  const awarenessMatch = clamp(35 + 25 * has(row.bridgeToPaidJson.awarenessLevel, 5) + 20 * has(row.funnelStage, 3));
  const trafficMatch = builder.trafficFitScore;

  const overallScore = clamp(
    clarity * 0.1 +
      specificity * 0.09 +
      relevance * 0.09 +
      offerAlignment * 0.12 +
      funnelFit * 0.09 +
      ctaStrength * 0.1 +
      easeOfConsumption * 0.08 +
      perceivedUsefulness * 0.1 +
      personaMatch * 0.08 +
      awarenessMatch * 0.07 +
      trafficMatch * 0.08,
  );

  const grade: LeadMagnetGradeResult["grade"] =
    overallScore < 50 ? "Weak"
    : overallScore < 66 ? "Usable"
    : overallScore < 82 ? "Strong"
    : "High Converting Potential";

  const frictionPoints: string[] = [];
  if (ctaStrength < 60) frictionPoints.push("CTA lacks urgency or clarity for the next conversion step.");
  if (offerAlignment < 60) frictionPoints.push("Bridge to paid offer is weak and may cause handoff drop-off.");
  if (easeOfConsumption < 60) frictionPoints.push("Consumption friction is high for expected traffic temperature.");
  if (specificity < 60) frictionPoints.push("Content promise is too broad and may attract low-intent leads.");

  const improvementActions = [
    ...builder.recommendations.slice(0, 3),
    ...(frictionPoints.length ? ["Reduce friction by tightening format, CTA, and bridge sequence."] : []),
  ].slice(0, 6);

  const recommendedUseCase =
    grade === "Weak" ? "Use for internal draft only; not ready for paid traffic."
    : grade === "Usable" ? "Use in warm audiences while improving hook and bridge."
    : grade === "Strong" ? "Use in organic + retargeting; test against one challenger."
    : "Use as primary acquisition asset for matched persona and traffic.";

  return {
    overallScore,
    grade,
    frictionPoints,
    improvementActions,
    recommendedUseCase,
  };
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

  const valueEquation = buildValueEquation(row);
  const grandSlam = buildGrandSlamOffer(row);
  const offerGrade = buildOfferGrade(row, valueEquation, grandSlam);

  const tier = tierFromScore(Math.round((overall + offerGrade.overallScore + valueEquation.normalizedScore) / 3));
  const biggest = offerGrade.topWeaknesses[0] ?? weaknesses[0] ?? "Offer needs stronger differentiation and handoff logic.";
  const mergedFixes = [...new Set([...fixes, ...offerGrade.fixActions, ...valueEquation.improvementSuggestions, ...grandSlam.recommendations])];

  return {
    overall: clamp(Math.round((overall * 0.45 + offerGrade.overallScore * 0.4 + valueEquation.normalizedScore * 0.15))),
    categoryScores,
    weaknesses: [...new Set([...weaknesses, ...offerGrade.topWeaknesses])].slice(0, 8),
    recommendedFixes: mergedFixes.slice(0, 10),
    tier,
    confidenceNotes:
      offerGrade.readinessStatus === "Launch Ready"
        ? "Offer is structurally strong; validate against live conversion events before scale."
        : "Conversion risk remains until core weaknesses and handoff gaps are addressed.",
    biggestConversionRisk: biggest,
    bestImprovementLever:
      offerGrade.fixActions[0] ??
      (categoryScores.problemClarity < categoryScores.perceivedLikelyOutcomeStrength
        ? "Sharpen the problem story before polishing copy."
        : "Deepen perceived likely outcome notes (believability + action confidence)."),
    valueEquation,
    grandSlam,
    offerGrade,
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

  const builder = buildLeadMagnetBuilder(row);
  const grade = buildLeadMagnetGrade(builder, row);
  const tier = tierFromScore(Math.round((overall + grade.overallScore) / 2));
  const mergedFixes = [...new Set([...fixes, ...builder.recommendations, ...grade.improvementActions])];

  return {
    overall: clamp(Math.round(overall * 0.5 + grade.overallScore * 0.5)),
    categoryScores,
    weaknesses: [...new Set([...weaknesses, ...builder.weaknesses, ...grade.frictionPoints])].slice(0, 8),
    recommendedFixes: mergedFixes.slice(0, 10),
    tier,
    confidenceNotes:
      grade.grade === "High Converting Potential"
        ? "Lead magnet is strategically strong; validate quality and downstream conversion by source."
        : "Lead magnet may underperform until hook, specificity, and bridge are tightened.",
    biggestConversionRisk: grade.frictionPoints[0] ?? weaknesses[0] ?? "Unclear bridge to paid offer.",
    bestImprovementLever: builder.recommendations[0] ?? (bridgeStrength < hookStrength ? "Strengthen bridge-to-offer copy and CTA" : "Sharpen hook and quick win"),
    leadMagnetBuilder: builder,
    leadMagnetGrade: grade,
  };
}
