import { normalizePersona, runRevenueDiagnostic } from "@/lib/revenue-system/diagnosticEngine";

describe("runRevenueDiagnostic", () => {
  it("calculates category and website/startup scores", () => {
    const result = runRevenueDiagnostic({
      fullName: "Test User",
      email: "test@example.com",
      persona: "operators",
      systems: {
        visibility: 4,
        conversion: 3,
        trust: 5,
        followUp: 2,
        capture: 4,
        retention: 3,
      },
      pains: ["Follow-up is manual"],
      monthlyRevenue: 40000,
      avgDealValue: 3500,
      monthlyLeads: 28,
      closeRatePercent: 22,
    });

    expect(result.categoryScores.visibility).toBe(80);
    expect(result.categoryScores.followUp).toBe(40);
    expect(result.websitePerformanceScore).toBeGreaterThan(0);
    expect(result.startupWebsiteScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.topBottlenecks.length).toBe(3);
  });

  it("maps founder persona to validation funnel recommendation", () => {
    const result = runRevenueDiagnostic({
      fullName: "Founder",
      email: "founder@example.com",
      persona: "founders",
      systems: {
        visibility: 2,
        conversion: 2,
        trust: 2,
        followUp: 2,
        capture: 2,
        retention: 2,
      },
      pains: [],
      monthlyRevenue: 12000,
      avgDealValue: 1200,
      monthlyLeads: 20,
      closeRatePercent: 8,
    });

    expect(result.recommendation.systemKey).toBe("validation_funnel");
    expect(result.revenueOpportunityEstimate).toBeGreaterThanOrEqual(0);
  });
});

describe("normalizePersona", () => {
  it("infers persona from free text", () => {
    expect(normalizePersona("Trades and local services")).toBe("trades");
    expect(normalizePersona("Freelance designer")).toBe("freelancers");
    expect(normalizePersona("Startup founder")).toBe("founders");
    expect(normalizePersona("Operations team")).toBe("operators");
  });
});
