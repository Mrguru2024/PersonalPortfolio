/**
 * Lightweight two-proportion z-test (pooled SE) for admin A/B readouts.
 * For exploration only — not a substitute for your analytics platform.
 */

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax));
  return sign * y;
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

export type TwoProportionResult = {
  rateA: number;
  rateB: number;
  z: number;
  pValue: number;
  /** (rateA - rateB) / rateB when rateB > 0 */
  relativeLiftVsB: number | null;
};

export function twoProportionZTest(
  convA: number,
  visitorsA: number,
  convB: number,
  visitorsB: number,
): TwoProportionResult | null {
  if (
    visitorsA <= 0 ||
    visitorsB <= 0 ||
    convA < 0 ||
    convB < 0 ||
    convA > visitorsA ||
    convB > visitorsB
  ) {
    return null;
  }
  const p1 = convA / visitorsA;
  const p2 = convB / visitorsB;
  const pooled = (convA + convB) / (visitorsA + visitorsB);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / visitorsA + 1 / visitorsB));
  if (se === 0) {
    return {
      rateA: p1,
      rateB: p2,
      z: 0,
      pValue: 1,
      relativeLiftVsB: p2 > 0 ? (p1 - p2) / p2 : null,
    };
  }
  const z = (p1 - p2) / se;
  const pValue = Math.min(1, Math.max(0, 2 * (1 - normalCdf(Math.abs(z)))));
  return {
    rateA: p1,
    rateB: p2,
    z,
    pValue,
    relativeLiftVsB: p2 > 0 ? (p1 - p2) / p2 : null,
  };
}
