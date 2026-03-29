import type { AmieFullAnalysis, AmieMarketInput, AmieRawSignals } from "./types";
import { buildPersonaStrategy, resolvePersonaArchetype } from "./personaStrategy";
import { runOpportunityEngine } from "./opportunityEngine";
import {
  classifyMarketTrend,
  computeCompetitionScore,
  computeDemandScore,
  computePainScore,
  computePurchasePowerScore,
  computeTargetingDifficulty,
  estimateAvgPrice,
} from "./metrics";
import { buildIntegrationHints } from "./integrationHints";

function buildSummary(input: AmieMarketInput, tier: string, trend: string): string {
  return [
    `AMIE snapshot: ${input.serviceType} in ${input.industry} (${input.location}).`,
    `Persona focus: ${input.persona}.`,
    `Opportunity tier: ${tier.toUpperCase()}; search interest trend: ${trend}.`,
    "Scores synthesize keyword demand, competition proxies, local economics, pain language, and paid-media difficulty.",
  ].join(" ");
}

function buildRecommendations(analysis: { marketData: AmieFullAnalysis["marketData"]; opportunity: AmieFullAnalysis["opportunity"] }): string {
  const d = analysis.marketData;
  const parts: string[] = [];

  const tier = analysis.opportunity.opportunityTier;
  if (tier === "high") {
    parts.push("Scale proven lead response and add capacity for inbound before increasing ad spend.");
  } else if (tier === "low") {
    parts.push("Narrow positioning or geography, validate unit economics on a small test budget, then expand.");
  } else {
    parts.push("Run structured experiments week-over-week; lock winning messaging before broadening channels.");
  }

  if (d.purchasePowerScore < 50) {
    parts.push("Test tiered packages or financing language; probe B2B buyers if consumer budgets are thin.");
  }
  if (d.targetingDifficulty > 70) {
    parts.push("Invest in earned/local presence and referral incentives parallel to any paid tests.");
  }
  if (d.painScore > 75) {
    parts.push("Put urgency and proof above the fold; shorten forms for high-intent keywords.");
  }

  return parts.join(" ");
}

function buildLeadStrategy(input: AmieMarketInput, pain: number, difficulty: number): string {
  const archetype = resolvePersonaArchetype(input.persona);
  const urgent = pain > 72;
  const lines = [
    urgent
      ? "Lead plan: bias to phone + calendar CTAs on high-intent pages; enforce <5 min first response where possible."
      : "Lead plan: education-first sequence with one clear conversion step per page; avoid multi-ask forms.",
  ];
  if (archetype === "marcus" || urgent) {
    lines.push("Parallel offline: local partnerships and dispatch boards can supplement digital when CPC is high.");
  }
  if (difficulty > 72) {
    lines.push("Reduce reliance on cold paid leads — grow retargeting pools from SEO and email first.");
  }
  return lines.join("\n");
}

function buildFunnelStrategy(pain: number, purchase: number, tier: string): string {
  if (pain > 80) {
    return "Funnel: aggressive capture — short landing, urgency framing, optional one-step booking; upsell after trust is earned.";
  }
  if (purchase < 45) {
    return "Funnel: value-stack + risk reversal (guarantees/pilot) before price; add calculator or ROI artifact mid-funnel.";
  }
  if (tier === "high") {
    return "Funnel: fast expansion — add variant pages per intent cluster; reuse winning hook on paid and organic.";
  }
  return "Funnel: standard VSL/webinar or case-study → application flow; instrument drop-off by step.";
}

function buildAdStrategy(difficulty: number, demand: number, keywords: AmieRawSignals["keywords"]): string {
  const seeds = keywords.slice(0, 5).map((k) => k.term);
  if (difficulty > 70) {
    return [
      "Ads: defer broad search; test high-intent exact match only with strict negatives.",
      `Seed themes: ${seeds.join("; ") || "derive from GA/search console"}.`,
      "Favor Local/Maps and remarketing before prospecting scale.",
    ].join(" ");
  }
  if (demand > 68) {
    return [
      "Ads: demand supports paid capture — start Search + Performance Max with tight geo; cap CPA early.",
      `Keyword seeds: ${seeds.join("; ")}.`,
    ].join(" ");
  }
  return [
    "Ads: validate creative-message fit on a narrow audience; expand only after stable CPL.",
    `Keyword seeds: ${seeds.join("; ")}.`,
  ].join(" ");
}

export function buildAmieFullAnalysis(
  input: AmieMarketInput,
  raw: AmieRawSignals,
  sources: AmieFullAnalysis["marketData"]["sources"],
  dataMode: AmieFullAnalysis["marketData"]["dataMode"],
): AmieFullAnalysis {
  const demandScore = computeDemandScore(raw);
  const competitionScore = computeCompetitionScore(raw);
  const purchasePowerScore = computePurchasePowerScore(raw);
  const painScore = computePainScore(raw);
  const targetingDifficulty = computeTargetingDifficulty(raw, competitionScore);
  const marketTrend = classifyMarketTrend(raw.trendSlope);
  const avgPrice = estimateAvgPrice(raw);

  const marketData: AmieFullAnalysis["marketData"] = {
    demandScore,
    competitionScore,
    purchasePowerScore,
    painScore,
    targetingDifficulty,
    marketTrend,
    avgPrice,
    keywordData: { keywords: raw.keywords, monthlySearchVolume: raw.monthlySearchVolume },
    trendData: { slope: raw.trendSlope, label: marketTrend },
    incomeData: {
      medianIncome: raw.medianIncome,
      homeownershipRate: raw.homeownershipRate,
      businessDensity: raw.businessDensity,
      spendingProxy: raw.spendingProxy,
    },
    competitionData: {
      competitorCount: raw.competitorCount,
      avgCompetitorRating: raw.avgCompetitorRating,
      totalReviewCount: raw.totalReviewCount,
      samples: raw.competitorSamples,
    },
    sources,
    dataMode,
  };

  const oppCore = runOpportunityEngine(marketData);
  const opportunity: AmieFullAnalysis["opportunity"] = {
    opportunityTier: oppCore.opportunityTier,
    rulesFired: oppCore.rulesFired,
    summary: buildSummary(input, oppCore.opportunityTier, marketTrend),
    insights: oppCore.insights,
    recommendations: "",
    personaStrategy: buildPersonaStrategy(input),
    leadStrategy: buildLeadStrategy(input, painScore, targetingDifficulty),
    funnelStrategy: buildFunnelStrategy(painScore, purchasePowerScore, oppCore.opportunityTier),
    adStrategy: buildAdStrategy(targetingDifficulty, demandScore, raw.keywords),
  };

  opportunity.recommendations = buildRecommendations({ marketData, opportunity });

  const integrationHints = buildIntegrationHints({
    input,
    marketData,
    opportunity,
    keywordSeeds: raw.keywords.map((k) => k.term),
  });

  return {
    input,
    marketData,
    opportunity,
    integrationHints,
  };
}
