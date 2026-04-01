import type { AmieOpportunityTier } from "./types";
import type { AmieMarketDataDTO } from "./types";

export type OpportunityEngineResult = {
  opportunityTier: AmieOpportunityTier;
  rulesFired: string[];
  insights: string[];
};

export function runOpportunityEngine(data: AmieMarketDataDTO): OpportunityEngineResult {
  const rulesFired: string[] = [];
  const insights: string[] = [];

  const { demandScore, competitionScore, painScore, purchasePowerScore, targetingDifficulty, marketTrend } = data;

  if (demandScore > 70 && competitionScore < 60) {
    rulesFired.push("HIGH_OPPORTUNITY_DEMAND_VS_COMP");
    insights.push("Demand is strong relative to measurable competition — prioritize capture and speed-to-lead.");
  }

  if (painScore > 80) {
    rulesFired.push("AGGRESSIVE_FUNNEL_PAIN");
    insights.push("Pain intensity is high — urgency-aware funnels and same-day response paths will outperform nurture-only flows.");
  }

  if (purchasePowerScore < 50) {
    rulesFired.push("PRICING_OR_PIVOT");
    insights.push("Purchase power is constrained — tighten offer economics, add payment flexibility, or emphasize ROI / B2B budget holders.");
  }

  if (targetingDifficulty > 70) {
    rulesFired.push("SEO_MAPS_REFERRALS_OVER_PPC");
    insights.push("Paid social/search looks expensive or saturated — lean on SEO, Google Business Profile, and referral loops before scaling PPC.");
  }

  if (marketTrend === "declining") {
    rulesFired.push("DECLINING_TREND_CAUTION");
    insights.push("Search/trend momentum is soft — validate with pipeline data before heavy media spend.");
  }

  if (marketTrend === "growing" && demandScore >= 55) {
    rulesFired.push("RIDE_GROWING_TREND");
    insights.push("Underlying interest trend is rising — good window to test incremental paid demand capture.");
  }

  let opportunityTier: AmieOpportunityTier = "medium";
  if (rulesFired.includes("HIGH_OPPORTUNITY_DEMAND_VS_COMP") && !rulesFired.includes("DECLINING_TREND_CAUTION")) {
    opportunityTier = "high";
  } else if (
    purchasePowerScore < 40 ||
    (targetingDifficulty > 85 && demandScore < 50) ||
    (competitionScore > 85 && demandScore < 45)
  ) {
    opportunityTier = "low";
  }

  if (insights.length === 0) {
    insights.push("Balanced market signals — iterate positioning and measure CAC before committing channel mix.");
  }

  return { opportunityTier, rulesFired, insights };
}
