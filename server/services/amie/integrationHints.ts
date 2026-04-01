import type { AmieFullAnalysis, AmieIntegrationHints, AmieMarketInput } from "./types";
import { resolvePersonaArchetype } from "./personaStrategy";

type BuildArgs = {
  input: AmieMarketInput;
  marketData: AmieFullAnalysis["marketData"];
  opportunity: AmieFullAnalysis["opportunity"];
  keywordSeeds: string[];
  researchId?: number;
};

export function buildIntegrationHints(args: BuildArgs): AmieIntegrationHints {
  const { marketData, opportunity, keywordSeeds, researchId } = args;
  const archetype = resolvePersonaArchetype(args.input.persona);

  const suggestedLeadFitScore = clampFit(
    marketData.demandScore,
    marketData.purchasePowerScore,
    marketData.painScore,
    marketData.competitionScore,
  );

  const qualificationNotes = [...opportunity.insights.slice(0, 4)];

  let suggestedFunnelArchetype = "Education → application";
  if (marketData.painScore > 80) suggestedFunnelArchetype = "Urgent capture → call/book";
  else if (archetype === "andre") suggestedFunnelArchetype = "Authority content → strategy call";
  else if (archetype === "devon") suggestedFunnelArchetype = "Validation micro-funnel → MVP offer";

  let offerPricingNote =
    marketData.purchasePowerScore < 50
      ? "Soften headline price; lead with outcomes and payment options."
      : "Price can reflect value; stack proof and guarantees.";

  const avoidBroadPpc = marketData.targetingDifficulty > 70;
  const suggestedCampaignTypes =
    avoidBroadPpc
      ? ["Local search (exact)", "Remarketing", "Performance Max (tight geo)"]
      : ["Search", "Demand Gen test", "PMax"];

  return {
    version: 1,
    suggestedLeadFitScore,
    qualificationNotes,
    suggestedFunnelArchetype,
    offerPricingNote,
    paidGrowth: {
      suggestedCampaignTypes,
      keywordSeeds: keywordSeeds.slice(0, 24),
      avoidBroadPpc,
    },
    crmMetadata: { engine: "amie", researchId },
  };
}

function clampFit(demand: number, ppi: number, pain: number, comp: number): number {
  let score = 50;
  score += (demand - 50) * 0.35;
  score += (ppi - 50) * 0.25;
  score += (pain - 50) * 0.2;
  score -= (comp - 50) * 0.2;
  return Math.max(5, Math.min(95, Math.round(score)));
}
