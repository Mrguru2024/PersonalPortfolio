import OpenAI from "openai";
import {
  calculateOfferValueScore,
  clampOfferInput,
  getOfferScoreBand,
  type OfferScoreBand,
  type OfferValueInputs,
} from "@shared/offerValuation";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export interface OfferValuationInsights {
  scoreBreakdown: {
    dreamOutcome: { score: number; explanation: string };
    perceivedLikelihood: { score: number; explanation: string };
    timeDelay: { score: number; explanation: string };
    effortAndSacrifice: { score: number; explanation: string };
  };
  offerDiagnosis: {
    strengths: string[];
    weaknesses: string[];
  };
  strategicFixes: string[];
  upgradedOffer: string;
  suggestedBonuses: string[];
  suggestedGuarantees: string[];
  positioningImprovements: string[];
  monetizationInsight: string;
  recommendationTier: "correction" | "optimization" | "scaling";
  aiGenerated: boolean;
}

export interface OfferValuationResult {
  inputsUsed: OfferValueInputs;
  rawScore: number;
  finalScore: number;
  scoreBand: OfferScoreBand;
  insights: OfferValuationInsights;
  aiUsed: boolean;
}

function weakestVariable(input: OfferValueInputs): keyof OfferValueInputs {
  const rows: Array<[keyof OfferValueInputs, number]> = [
    ["dreamOutcome", input.dreamOutcome],
    ["perceivedLikelihood", input.perceivedLikelihood],
    ["timeDelay", 11 - input.timeDelay],
    ["effortAndSacrifice", 11 - input.effortAndSacrifice],
  ];
  rows.sort((a, b) => a[1] - b[1]);
  return rows[0][0];
}

function labelForInput(k: keyof OfferValueInputs): string {
  if (k === "dreamOutcome") return "Dream Outcome";
  if (k === "perceivedLikelihood") return "Perceived Likelihood";
  if (k === "timeDelay") return "Time Delay";
  return "Effort & Sacrifice";
}

function explanationForInput(k: keyof OfferValueInputs, v: number): string {
  if (k === "dreamOutcome") {
    if (v <= 4) return "The offer promise feels generic and not compelling.";
    if (v <= 7) return "The outcome is useful but could be sharper or more specific.";
    return "The outcome is concrete and desirable for the target buyer.";
  }
  if (k === "perceivedLikelihood") {
    if (v <= 4) return "Trust signals are weak; buyers may doubt the result.";
    if (v <= 7) return "Some proof exists, but confidence can still improve.";
    return "Proof and credibility support belief that results are achievable.";
  }
  if (k === "timeDelay") {
    if (v >= 8) return "Buyers likely feel results take too long to materialize.";
    if (v >= 5) return "Time to value is acceptable but not yet fast-feeling.";
    return "Time to first meaningful result appears fast and motivating.";
  }
  if (v >= 8) return "Execution burden looks high, creating resistance.";
  if (v >= 5) return "Execution burden is moderate; simplification would help.";
  return "The path feels simple and low-friction for the buyer.";
}

function deterministicByBand(
  band: OfferScoreBand,
  weakest: keyof OfferValueInputs,
): Pick<
  OfferValuationInsights,
  | "strategicFixes"
  | "upgradedOffer"
  | "suggestedBonuses"
  | "suggestedGuarantees"
  | "positioningImprovements"
  | "monetizationInsight"
  | "recommendationTier"
> {
  const weakLabel = labelForInput(weakest);
  if (band === "low") {
    return {
      strategicFixes: [
        `Rebuild the offer around ${weakLabel}; this is the primary conversion blocker.`,
        "Narrow the ICP and headline to one urgent problem with one measurable outcome.",
        "Add concrete proof: case snippet, before/after examples, or process transparency.",
        "Create a 7-day quick-win milestone so buyers see early progress.",
      ],
      upgradedOffer:
        "In 14 days, we turn your offer into a clear, trust-backed conversion package: refined promise, proof-first messaging, and a buyer-ready CTA path you can launch this month.",
      suggestedBonuses: [
        "Offer positioning teardown (video walkthrough)",
        "Conversion-focused headline and CTA swipe set",
        "90-day implementation checklist",
      ],
      suggestedGuarantees: [
        "Clarity guarantee: rewritten core offer and messaging delivered in full",
        "Implementation support window for launch week",
      ],
      positioningImprovements: [
        "Lead with one high-stakes problem and quantified destination.",
        "Replace vague claims with evidence and process specifics.",
      ],
      monetizationInsight:
        "Current packaging underprices impact. Productize this as a paid offer-refinement sprint, then upsell implementation retainers.",
      recommendationTier: "correction",
    };
  }
  if (band === "mid") {
    return {
      strategicFixes: [
        `Tune ${weakLabel} to move the offer from 'good' to 'obvious choice'.`,
        "Reduce delivery friction with templates, SOPs, or guided implementation.",
        "Add layered proof by persona and business context.",
        "Strengthen CTA sequencing with one primary next step.",
      ],
      upgradedOffer:
        "We optimize your existing offer into a high-conviction growth package with clearer positioning, stronger proof, and a lower-friction delivery experience.",
      suggestedBonuses: [
        "Persona-specific objection handling scripts",
        "Implementation kickoff template",
        "Offer test matrix for A/B messaging",
      ],
      suggestedGuarantees: [
        "Onboarding speed guarantee (defined launch window)",
        "Iteration guarantee for offer messaging within the first cycle",
      ],
      positioningImprovements: [
        "Frame value in measurable business outcomes, not deliverables alone.",
        "Differentiate with process visibility and milestone commitments.",
      ],
      monetizationInsight:
        "This can evolve into a premium optimization product plus recurring advisory/retainer support.",
      recommendationTier: "optimization",
    };
  }
  return {
    strategicFixes: [
      `Protect the edge by systematizing ${weakLabel} before scale.`,
      "Package outcomes into tiered offers for different buyer maturity levels.",
      "Add high-leverage upsells (advisory, implementation, managed growth).",
      "Instrument conversion checkpoints to prevent message drift during scale.",
    ],
    upgradedOffer:
      "Scale-ready offer system: premium core package, clear expansion paths, and operational guardrails to maintain conversion quality as volume grows.",
    suggestedBonuses: [
      "Executive KPI dashboard setup",
      "Quarterly offer refresh workshop",
      "Sales team messaging enablement pack",
    ],
    suggestedGuarantees: [
      "Implementation confidence guarantee with milestone accountability",
      "Strategic review guarantee each cycle for continuous performance improvements",
    ],
    positioningImprovements: [
      "Position as the safest high-ROI path, not the cheapest option.",
      "Publish stronger category authority and benchmark-driven narratives.",
    ],
    monetizationInsight:
      "This is ready for multi-tier monetization: flagship service, implementation layer, and strategic continuity offer.",
    recommendationTier: "scaling",
  };
}

function baseDiagnosis(input: OfferValueInputs): {
  strengths: string[];
  weaknesses: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (input.dreamOutcome >= 7) strengths.push("Outcome promise is attractive.");
  else weaknesses.push("Outcome promise is not specific enough.");

  if (input.perceivedLikelihood >= 7) strengths.push("Credibility is relatively strong.");
  else weaknesses.push("Proof and certainty cues are too light.");

  if (input.timeDelay <= 4) strengths.push("Time to value feels acceptable.");
  else weaknesses.push("Time to value feels too slow.");

  if (input.effortAndSacrifice <= 4) strengths.push("Adoption friction is low.");
  else weaknesses.push("Execution effort appears heavy.");

  return { strengths, weaknesses };
}

function sanitizeList(value: unknown, max = 6): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0)
    .slice(0, max);
}

function sanitizeText(value: unknown, max = 1400): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function clampInputSet(input: OfferValueInputs): OfferValueInputs {
  return {
    dreamOutcome: clampOfferInput(input.dreamOutcome),
    perceivedLikelihood: clampOfferInput(input.perceivedLikelihood),
    timeDelay: clampOfferInput(input.timeDelay),
    effortAndSacrifice: clampOfferInput(input.effortAndSacrifice),
  };
}

async function aiEnhanceInsights(input: {
  persona: string;
  offerName: string;
  description: string;
  scores: OfferValueInputs;
  finalScore: number;
  base: OfferValuationInsights;
}): Promise<OfferValuationInsights | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.25,
      max_tokens: 1400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an offer strategy analyst. Return valid JSON only. Avoid hype, fabricated guarantees, and unrealistic promises. Keep recommendations grounded and practical.",
        },
        {
          role: "user",
          content: `Enhance this offer valuation output.
Input:
- Persona: ${input.persona}
- Offer: ${input.offerName}
- Description: ${input.description.slice(0, 3000)}
- Scores: ${JSON.stringify(input.scores)}
- Final score: ${input.finalScore}

Return JSON keys exactly:
{
  "offerDiagnosis": { "strengths": string[], "weaknesses": string[] },
  "strategicFixes": string[],
  "upgradedOffer": string,
  "suggestedBonuses": string[],
  "suggestedGuarantees": string[],
  "positioningImprovements": string[],
  "monetizationInsight": string
}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const json = JSON.parse(raw) as Record<string, unknown>;

    return {
      ...input.base,
      offerDiagnosis: {
        strengths: sanitizeList(
          (json.offerDiagnosis as Record<string, unknown> | undefined)
            ?.strengths,
          6,
        ),
        weaknesses: sanitizeList(
          (json.offerDiagnosis as Record<string, unknown> | undefined)
            ?.weaknesses,
          6,
        ),
      },
      strategicFixes: sanitizeList(json.strategicFixes, 8),
      upgradedOffer: sanitizeText(json.upgradedOffer, 1800),
      suggestedBonuses: sanitizeList(json.suggestedBonuses, 6),
      suggestedGuarantees: sanitizeList(json.suggestedGuarantees, 6),
      positioningImprovements: sanitizeList(json.positioningImprovements, 6),
      monetizationInsight: sanitizeText(json.monetizationInsight, 900),
      aiGenerated: true,
    };
  } catch (error) {
    console.error("[offerValuation] AI enhancement failed:", error);
    return null;
  }
}

export async function suggestOfferScoresFromDescription(input: {
  persona?: string | null;
  offerName: string;
  description: string;
}): Promise<{
  suggestedScores: OfferValueInputs;
  summary: string;
  aiUsed: boolean;
}> {
  const fallback: OfferValueInputs = {
    dreamOutcome: 6,
    perceivedLikelihood: 5,
    timeDelay: 6,
    effortAndSacrifice: 6,
  };
  const client = getOpenAIClient();
  if (!client) {
    return {
      suggestedScores: fallback,
      summary:
        "AI is unavailable, so default starting scores were applied. Adjust based on your real offer context.",
      aiUsed: false,
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You estimate 100M value-equation inputs from offer copy. Return JSON only with realistic values 1-10 and no exaggerated claims.",
        },
        {
          role: "user",
          content: `Suggest initial scores for this offer.
Persona: ${input.persona ?? "General"}
Offer name: ${input.offerName}
Description: ${input.description.slice(0, 2500)}

Return:
{
  "dreamOutcome": number,
  "perceivedLikelihood": number,
  "timeDelay": number,
  "effortAndSacrifice": number,
  "summary": string
}`,
        },
      ],
    });
    const raw = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const suggestedScores = clampInputSet({
      dreamOutcome: Number(parsed.dreamOutcome),
      perceivedLikelihood: Number(parsed.perceivedLikelihood),
      timeDelay: Number(parsed.timeDelay),
      effortAndSacrifice: Number(parsed.effortAndSacrifice),
    });
    return {
      suggestedScores,
      summary:
        sanitizeText(parsed.summary, 500) ||
        "AI suggested starting scores from your offer description.",
      aiUsed: true,
    };
  } catch (error) {
    console.error("[offerValuation] AI score suggestion failed:", error);
    return {
      suggestedScores: fallback,
      summary:
        "AI score suggestion failed. Default scores were provided so you can continue.",
      aiUsed: false,
    };
  }
}

export async function runOfferValuation(input: {
  persona?: string | null;
  offerName: string;
  description: string;
  scores: OfferValueInputs;
  aiEnabled: boolean;
}): Promise<OfferValuationResult> {
  const inputsUsed = clampInputSet(input.scores);
  const value = calculateOfferValueScore(inputsUsed);
  const scoreBand = getOfferScoreBand(value.normalizedScore);
  const weakest = weakestVariable(inputsUsed);
  const diagnosis = baseDiagnosis(inputsUsed);
  const byBand = deterministicByBand(scoreBand, weakest);

  const baseInsights: OfferValuationInsights = {
    scoreBreakdown: {
      dreamOutcome: {
        score: inputsUsed.dreamOutcome,
        explanation: explanationForInput("dreamOutcome", inputsUsed.dreamOutcome),
      },
      perceivedLikelihood: {
        score: inputsUsed.perceivedLikelihood,
        explanation: explanationForInput(
          "perceivedLikelihood",
          inputsUsed.perceivedLikelihood,
        ),
      },
      timeDelay: {
        score: inputsUsed.timeDelay,
        explanation: explanationForInput("timeDelay", inputsUsed.timeDelay),
      },
      effortAndSacrifice: {
        score: inputsUsed.effortAndSacrifice,
        explanation: explanationForInput(
          "effortAndSacrifice",
          inputsUsed.effortAndSacrifice,
        ),
      },
    },
    offerDiagnosis: diagnosis,
    strategicFixes: byBand.strategicFixes,
    upgradedOffer: byBand.upgradedOffer,
    suggestedBonuses: byBand.suggestedBonuses,
    suggestedGuarantees: byBand.suggestedGuarantees,
    positioningImprovements: byBand.positioningImprovements,
    monetizationInsight: byBand.monetizationInsight,
    recommendationTier: byBand.recommendationTier,
    aiGenerated: false,
  };

  if (!input.aiEnabled) {
    return {
      inputsUsed,
      rawScore: value.rawScore,
      finalScore: value.normalizedScore,
      scoreBand,
      insights: baseInsights,
      aiUsed: false,
    };
  }

  const enhanced = await aiEnhanceInsights({
    persona: input.persona?.trim() || "General",
    offerName: input.offerName,
    description: input.description,
    scores: inputsUsed,
    finalScore: value.normalizedScore,
    base: baseInsights,
  });

  return {
    inputsUsed,
    rawScore: value.rawScore,
    finalScore: value.normalizedScore,
    scoreBand,
    insights: enhanced ?? baseInsights,
    aiUsed: enhanced != null,
  };
}

