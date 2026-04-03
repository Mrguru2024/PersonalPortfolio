import { calculateGuaranteePreview, evaluateGuaranteeFromMetrics } from "../guaranteeEngineLogic";

const compliant = { isCompliant: true, reasons: [] as string[] };

describe("evaluateGuaranteeFromMetrics", () => {
  it("marks lead_flow not_met when no qualified leads", () => {
    const out = evaluateGuaranteeFromMetrics({
      qualifiedLeadsCount: 0,
      bookedJobsCount: 0,
      conversionRate: 0,
      baselineConversionRate: 0.1,
      revenueGenerated: 0,
      systemCost: 100,
      roiPercentage: 0,
      compliance: compliant,
    });
    expect(out.rows.find((r) => r.type === "lead_flow")?.status).toBe("not_met");
  });

  it("marks booked_jobs not_met when no bookings", () => {
    const out = evaluateGuaranteeFromMetrics({
      qualifiedLeadsCount: 5,
      bookedJobsCount: 0,
      conversionRate: 0,
      baselineConversionRate: 0.1,
      revenueGenerated: 0,
      systemCost: 100,
      roiPercentage: 10,
      compliance: compliant,
    });
    expect(out.rows.find((r) => r.type === "booked_jobs")?.status).toBe("not_met");
  });

  it("marks conversion not_met when rate does not beat baseline", () => {
    const out = evaluateGuaranteeFromMetrics({
      qualifiedLeadsCount: 10,
      bookedJobsCount: 1,
      conversionRate: 0.1,
      baselineConversionRate: 0.2,
      revenueGenerated: 500,
      systemCost: 100,
      roiPercentage: 50,
      compliance: compliant,
    });
    expect(out.rows.find((r) => r.type === "conversion")?.status).toBe("not_met");
  });

  it("marks payback not_met when roi <= 0 and system cost > 0", () => {
    const out = evaluateGuaranteeFromMetrics({
      qualifiedLeadsCount: 10,
      bookedJobsCount: 5,
      conversionRate: 0.5,
      baselineConversionRate: 0.1,
      revenueGenerated: 100,
      systemCost: 500,
      roiPercentage: -50,
      compliance: compliant,
    });
    expect(out.rows.find((r) => r.type === "payback")?.status).toBe("not_met");
  });

  it("marks payback pending when system cost is zero", () => {
    const out = evaluateGuaranteeFromMetrics({
      qualifiedLeadsCount: 10,
      bookedJobsCount: 5,
      conversionRate: 0.5,
      baselineConversionRate: 0.1,
      revenueGenerated: 100,
      systemCost: 0,
      roiPercentage: 0,
      compliance: compliant,
    });
    expect(out.rows.find((r) => r.type === "payback")?.status).toBe("pending");
  });

  it("flags action_required when client is non-compliant", () => {
    const out = evaluateGuaranteeFromMetrics({
      qualifiedLeadsCount: 10,
      bookedJobsCount: 5,
      conversionRate: 0.5,
      baselineConversionRate: 0.1,
      revenueGenerated: 1000,
      systemCost: 100,
      roiPercentage: 200,
      compliance: { isCompliant: false, reasons: ["Minimum traffic threshold is not met."] },
    });
    expect(out.dashboardStatus).toBe("action_required");
    expect(out.dashboardColor).toBe("red");
  });
});

describe("calculateGuaranteePreview", () => {
  it("projects leads, jobs, and ROI from inputs", () => {
    const out = calculateGuaranteePreview({
      monthlyTraffic: 1000,
      estimatedConversionRate: 10,
      avgJobValue: 5000_00,
      systemCost: 2000_00,
    });
    expect(out.projectedLeads).toBe(100);
    expect(out.projectedJobs).toBe(35);
    expect(out.projectedRevenue).toBe(175000_00);
    expect(out.projectedRoiPercentage).toBeGreaterThan(0);
  });
});
