import { calculateOfferValuation } from "./engine";

describe("calculateOfferValuation", () => {
  it("returns low-band diagnostics for weak offers", () => {
    const result = calculateOfferValuation({
      persona: "Local service owner",
      offerName: "Basic Website Package",
      description: "Template setup with minimal support",
      dreamOutcomeScore: 3,
      likelihoodScore: 3,
      timeDelayScore: 9,
      effortScore: 9,
    });

    expect(result.finalScore).toBeLessThan(5);
    expect(result.insights.band).toBe("low");
    expect(
      result.insights.strategicRecommendations.some(
        (rec) => rec.area === "dream_outcome",
      ),
    ).toBe(true);
    expect(
      result.insights.strategicRecommendations.some(
        (rec) => rec.area === "likelihood",
      ),
    ).toBe(true);
  });

  it("returns mid-band diagnostics for moderate offers", () => {
    const result = calculateOfferValuation({
      persona: "Startup founder",
      offerName: "Growth Accelerator",
      description: "Guided strategy with phased implementation",
      dreamOutcomeScore: 7,
      likelihoodScore: 7,
      timeDelayScore: 4,
      effortScore: 4,
    });

    expect(result.finalScore).toBeGreaterThanOrEqual(5);
    expect(result.finalScore).toBeLessThan(8);
    expect(result.insights.band).toBe("mid");
    expect(result.insights.summary.toLowerCase()).toContain("moderate");
  });

  it("returns high-band diagnostics for strong offers", () => {
    const result = calculateOfferValuation({
      persona: "Scale-up operator",
      offerName: "Revenue Ops Intensive",
      description: "High-touch execution with rapid milestone delivery",
      dreamOutcomeScore: 10,
      likelihoodScore: 10,
      timeDelayScore: 2,
      effortScore: 2,
    });

    expect(result.finalScore).toBeGreaterThanOrEqual(8);
    expect(result.insights.band).toBe("high");
    expect(result.insights.strengths.length).toBeGreaterThan(0);
    expect(result.insights.upgradeSuggestions.positioningStatement).toContain(
      "Revenue Ops Intensive",
    );
  });
});
