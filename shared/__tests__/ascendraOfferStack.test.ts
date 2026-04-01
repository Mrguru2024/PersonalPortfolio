import {
  computeJobRevenueImpact,
  midSetupFeeCentsDfy,
  recommendOfferTier,
} from "@shared/ascendraOfferStack";

describe("computeJobRevenueImpact", () => {
  it("computes potential revenue, gap, and implied jobs from leads × close rate", () => {
    const r = computeJobRevenueImpact({
      averageJobValue: 1_000,
      jobsPerMonthGoal: 10,
      qualifiedLeadsPerMonth: 20,
      leadToJobCloseRate: 0.25,
    });
    expect(r.potentialMonthlyRevenue).toBe(10_000);
    expect(r.impliedJobsFromLeads).toBe(5);
    expect(r.estimatedCurrentMonthlyRevenue).toBe(5_000);
    expect(r.estimatedMonthlyGap).toBe(5_000);
    expect(r.disclaimer).toContain("Illustrative");
  });

  it("uses default close rate when omitted", () => {
    const r = computeJobRevenueImpact({
      averageJobValue: 2_000,
      jobsPerMonthGoal: 4,
      qualifiedLeadsPerMonth: 10,
    });
    expect(r.impliedJobsFromLeads).toBe(2.5);
    expect(r.estimatedCurrentMonthlyRevenue).toBe(5_000);
    expect(r.potentialMonthlyRevenue).toBe(8_000);
    expect(r.estimatedMonthlyGap).toBe(3_000);
  });

  it("clamps negative inputs to zero", () => {
    const r = computeJobRevenueImpact({
      averageJobValue: -500,
      jobsPerMonthGoal: -2,
      qualifiedLeadsPerMonth: -1,
      leadToJobCloseRate: -0.5,
    });
    expect(r.potentialMonthlyRevenue).toBe(0);
    expect(r.estimatedCurrentMonthlyRevenue).toBe(0);
    expect(r.estimatedMonthlyGap).toBe(0);
    expect(r.impliedJobsFromLeads).toBe(0);
    expect(r.breakEvenMonthsOnSetupMid).toBeNull();
  });

  it("break-even months uses DFY setup midpoint over monthly gap when gap > 0", () => {
    const setupMidUsd = midSetupFeeCentsDfy() / 100;
    const r = computeJobRevenueImpact({
      averageJobValue: 1_000,
      jobsPerMonthGoal: 10,
      qualifiedLeadsPerMonth: 10,
      leadToJobCloseRate: 0.25,
    });
    expect(r.estimatedMonthlyGap).toBe(7_500);
    expect(r.breakEvenMonthsOnSetupMid).toBe(Math.ceil(setupMidUsd / 7_500));
  });
});

describe("recommendOfferTier", () => {
  it("returns DIY when jobs goal is zero or negative after clamping context", () => {
    expect(
      recommendOfferTier({
        averageJobValue: 3_000,
        jobsPerMonthGoal: 0,
        qualifiedLeadsPerMonth: 50,
      }),
    ).toBe("DIY");
  });

  it("returns DWY when implied jobs are already near goal (ratio ≥ 0.85)", () => {
    expect(
      recommendOfferTier({
        averageJobValue: 1_000,
        jobsPerMonthGoal: 10,
        qualifiedLeadsPerMonth: 34,
        leadToJobCloseRate: 0.25,
      }),
    ).toBe("DWY");
  });

  it("returns DFY for aggressive goal with weak pipeline (goal ≥ 8 and ratio < 0.5)", () => {
    expect(
      recommendOfferTier({
        averageJobValue: 1_000,
        jobsPerMonthGoal: 10,
        qualifiedLeadsPerMonth: 15,
        leadToJobCloseRate: 0.25,
      }),
    ).toBe("DFY");
  });

  it("returns DFY when ratio < 0.35", () => {
    expect(
      recommendOfferTier({
        averageJobValue: 800,
        jobsPerMonthGoal: 10,
        qualifiedLeadsPerMonth: 10,
        leadToJobCloseRate: 0.25,
      }),
    ).toBe("DFY");
  });

  it("returns DWY in the middle band when not DFY gates", () => {
    expect(
      recommendOfferTier({
        averageJobValue: 1_000,
        jobsPerMonthGoal: 10,
        qualifiedLeadsPerMonth: 20,
        leadToJobCloseRate: 0.25,
      }),
    ).toBe("DWY");
  });
});
