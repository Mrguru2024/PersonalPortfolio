import type { ProposalPrepProfitabilityInputs } from "@shared/crmSchema";

export type ProfitabilityMetrics = {
  internalLaborCost: number;
  passThroughCosts: number;
  commissionAmount: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPct: number;
  /** Price needed to hit targetGrossMarginPct (if inputs valid). */
  suggestedPriceForTargetMargin: number | null;
};

function n(v: number | null | undefined): number {
  if (v == null || !Number.isFinite(Number(v))) return 0;
  return Number(v);
}

/**
 * Deterministic profitability math for proposal prep (no network).
 * Commission is modeled as a percent of quoted price.
 */
export function computeProposalProfitability(
  inputs: ProposalPrepProfitabilityInputs | null | undefined
): ProfitabilityMetrics {
  const quoted = n(inputs?.quotedPrice);
  const hours = n(inputs?.internalHours);
  const hourly = n(inputs?.hourlyCost);
  const passThrough = n(inputs?.passThroughCosts);
  const commPct = Math.max(0, Math.min(100, n(inputs?.salesCommissionPct)));
  const targetMarginPct = Math.max(0, Math.min(99.9, n(inputs?.targetGrossMarginPct)));

  const internalLaborCost = hours * hourly;
  const commissionAmount = quoted > 0 ? (quoted * commPct) / 100 : 0;
  const totalCost = internalLaborCost + passThrough + commissionAmount;
  const grossProfit = quoted - totalCost;
  const grossMarginPct = quoted > 0 ? (grossProfit / quoted) * 100 : 0;

  let suggestedPriceForTargetMargin: number | null = null;
  if (targetMarginPct > 0 && targetMarginPct < 100) {
    const variableRate = commPct / 100;
    const netMultiplier = 1 - targetMarginPct / 100 - variableRate;
    if (netMultiplier > 0.001) {
      const base = internalLaborCost + passThrough;
      suggestedPriceForTargetMargin = Math.round((base / netMultiplier) * 100) / 100;
    }
  }

  return {
    internalLaborCost,
    passThroughCosts: passThrough,
    commissionAmount,
    totalCost,
    grossProfit,
    grossMarginPct: Math.round(grossMarginPct * 10) / 10,
    suggestedPriceForTargetMargin,
  };
}
