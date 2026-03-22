import { computeProposalProfitability } from "./proposal-prep-profitability";

describe("computeProposalProfitability", () => {
  it("computes margin and profit for a simple quote", () => {
    const m = computeProposalProfitability({
      quotedPrice: 10000,
      internalHours: 40,
      hourlyCost: 100,
      passThroughCosts: 500,
      salesCommissionPct: 10,
    });
    expect(m.internalLaborCost).toBe(4000);
    expect(m.commissionAmount).toBe(1000);
    expect(m.totalCost).toBe(5500);
    expect(m.grossProfit).toBe(4500);
    expect(m.grossMarginPct).toBe(45);
  });

  it("suggests price for target margin when mathematically possible", () => {
    const m = computeProposalProfitability({
      internalHours: 10,
      hourlyCost: 100,
      passThroughCosts: 0,
      salesCommissionPct: 0,
      targetGrossMarginPct: 50,
    });
    expect(m.suggestedPriceForTargetMargin).toBe(2000);
  });
});
