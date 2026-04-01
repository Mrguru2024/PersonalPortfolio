import type { AmieMarketInput, AmieRawSignals } from "../types";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Deterministic pseudo-market from inputs — safe fallback when live APIs are off or fail. */
export function buildMockSignals(input: AmieMarketInput): AmieRawSignals {
  const key = [input.industry, input.serviceType, input.location, input.persona].join("|").toLowerCase();
  const h = hashString(key);

  const r = (offset: number, max: number) => (h >> offset) % max;
  const rf = (offset: number) => ((h >> offset) % 10000) / 10000;

  const monthlySearchVolume = 800 + r(0, 24000) + r(4, 8000);
  const trendSlope = rf(8) * 0.24 - 0.12;
  const competitorCount = 3 + r(12, 38);
  const avgCompetitorRating = 3.2 + rf(16) * 1.6;
  const totalReviewCount = 40 + r(20, 2200);
  const medianIncome = 42000 + r(24, 78000);
  const homeownershipRate = 0.35 + rf(28) * 0.45;
  const businessDensity = rf(32) * 0.85 + 0.05;
  const spendingProxy = rf(36) * 0.7 + 0.15;
  const estimatedCpc = 0.85 + rf(40) * 18;
  const adSaturationProxy = 15 + r(44, 72);

  const painKeywordHits = {
    emergency: r(48, 12),
    urgent: r(52, 18),
    upgrade: r(56, 25),
    informational: 30 + r(60, 80),
  };

  const baseTerms = [
    `${input.serviceType} ${input.location}`.trim(),
    `${input.industry} ${input.serviceType}`.trim(),
    `best ${input.serviceType} near me`,
    `emergency ${input.serviceType}`,
    `${input.serviceType} cost`,
  ];

  const keywords = baseTerms.map((term, i) => {
    let intent: "high" | "medium" | "low" = "low";
    if (i === 0 || i === 3) intent = "high";
    else if (i === 4) intent = "medium";
    return {
      term: term.slice(0, 80),
      volume: Math.max(50, Math.floor(monthlySearchVolume / (5 + i) + r(i * 3, 500))),
      intent,
    };
  });

  const competitorSamples = Array.from({ length: Math.min(competitorCount, 8) }, (_, i) => ({
    name: `${input.industry.slice(0, 20) || "Local"} competitor ${i + 1}`,
    rating: Math.min(5, avgCompetitorRating + (rf(50 + i) - 0.5) * 0.8),
    reviewCount: 5 + r(60 + i * 7, 400),
    distanceKm: 0.5 + rf(70 + i) * 12,
  }));

  return {
    monthlySearchVolume,
    trendSlope,
    competitorCount,
    avgCompetitorRating,
    totalReviewCount,
    medianIncome,
    homeownershipRate,
    businessDensity,
    spendingProxy,
    estimatedCpc,
    adSaturationProxy,
    painKeywordHits,
    keywords,
    competitorSamples,
  };
}
