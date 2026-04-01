import type { AmieMarketTrend } from "./types";
import type { AmieRawSignals } from "./types";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/** Keyword volume + trend direction. */
export function computeDemandScore(s: AmieRawSignals): number {
  const volNorm = clamp((Math.log10(s.monthlySearchVolume + 10) / Math.log10(200_000)) * 100, 0, 100);
  const trendBump = s.trendSlope * 35;
  return clamp(volNorm + trendBump, 0, 100);
}

/** Competitors, reviews, ratings (higher rating = stronger incumbents). */
export function computeCompetitionScore(s: AmieRawSignals): number {
  const countPart = clamp(s.competitorCount * 2.2, 0, 55);
  const reviewPart = clamp(Math.log10(s.totalReviewCount + 1) * 18, 0, 35);
  const ratingPart = clamp((s.avgCompetitorRating - 3.25) * 18, 0, 25);
  return clamp(countPart + reviewPart * 0.6 + ratingPart, 0, 100);
}

/** Purchase Power Index — income 40%, homeownership 20%, business density 20%, spending 20%. */
export function computePurchasePowerScore(s: AmieRawSignals): number {
  const incomeNorm = clamp((s.medianIncome / 140_000) * 100, 0, 100);
  const homeNorm = clamp(s.homeownershipRate * 100, 0, 100);
  const bizNorm = clamp(s.businessDensity * 100, 0, 100);
  const spendNorm = clamp(s.spendingProxy * 100, 0, 100);
  return clamp(incomeNorm * 0.4 + homeNorm * 0.2 + bizNorm * 0.2 + spendNorm * 0.2, 0, 100);
}

/** Pain intensity from keyword / review proxies. */
export function computePainScore(s: AmieRawSignals): number {
  const high = s.painKeywordHits.emergency + s.painKeywordHits.urgent;
  const med = s.painKeywordHits.upgrade;
  const low = s.painKeywordHits.informational;
  const raw = high * 3 + med * 1.5 + low * 0.35;
  const norm = clamp((raw / 120) * 100, 0, 100);
  return norm;
}

/** Targeting difficulty — CPC, competition density proxy, ad saturation. */
export function computeTargetingDifficulty(s: AmieRawSignals, competitionScore: number): number {
  const cpcNorm = clamp((s.estimatedCpc / 22) * 100, 0, 100);
  const compPart = competitionScore * 0.3;
  const satPart = (s.adSaturationProxy / 100) * 100 * 0.3;
  return clamp(cpcNorm * 0.4 + compPart + satPart, 0, 100);
}

export function classifyMarketTrend(trendSlope: number): AmieMarketTrend {
  if (trendSlope > 0.06) return "growing";
  if (trendSlope < -0.06) return "declining";
  return "stable";
}

/** Rough ticket estimate from service string length + market heat (placeholder until live pricing APIs). */
export function estimateAvgPrice(s: AmieRawSignals): number {
  const base = 120 + s.competitorCount * 4 + s.estimatedCpc * 6;
  return Math.round(clamp(base, 49, 899));
}
