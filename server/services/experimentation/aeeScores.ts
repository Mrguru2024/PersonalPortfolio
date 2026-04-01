import type { VariantMetricRollup } from "./aeeInsightEngine";

/** Single composite score from variant rollups (internal preview; not a statistical guarantee). */
export function computeAeeExperimentScore0to100(rollups: VariantMetricRollup[]): {
  score: number;
  confidence0to100: number;
  factors: { conversionLift: number; revenueIndex: number; sampleStrength: number };
} | null {
  if (!rollups.length) return null;
  const maxConv = Math.max(0, ...rollups.map((r) => r.convRate ?? 0));
  const maxRev = Math.max(0, ...rollups.map((r) => r.revenueCents));
  const totalVisitors = rollups.reduce((a, r) => a + r.visitors, 0);
  const sampleStrength = Math.min(100, Math.sqrt(totalVisitors) * 10);

  let conversionLift = 0;
  if (rollups.length > 1 && maxConv > 0) {
    const minConv = Math.min(...rollups.map((r) => r.convRate ?? 0));
    conversionLift = Math.min(100, ((maxConv - minConv) / maxConv) * 100);
  } else {
    conversionLift = maxConv > 0 ? Math.min(100, maxConv * 5000) : 0;
  }

  const revenueIndex = maxRev > 0 ? Math.min(100, Math.log1p(maxRev / 100) * 25) : 0;
  const score = Math.round(conversionLift * 0.45 + revenueIndex * 0.35 + sampleStrength * 0.2);
  const confidence0to100 = Math.round(Math.min(95, sampleStrength * 0.9));

  return {
    score: Math.min(100, Math.max(0, score)),
    confidence0to100,
    factors: { conversionLift, revenueIndex, sampleStrength },
  };
}
