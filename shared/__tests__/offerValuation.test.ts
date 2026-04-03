import {
  analyzeValueEquation,
  calculateOfferValueScore,
  getOfferScoreBand,
  normalizedValueScoreTo100,
  valueEquationRatingFrom100,
} from "@shared/offerValuation";

describe("offer valuation score helpers", () => {
  it("maps low equation inputs to low score band", () => {
    const result = calculateOfferValueScore({
      dreamOutcome: 3,
      perceivedLikelihood: 3,
      timeDelay: 8,
      effortAndSacrifice: 9,
    });
    expect(result.normalizedScore).toBeLessThan(5);
    expect(getOfferScoreBand(result.normalizedScore)).toBe("low");
  });

  it("produces expected low/mid/high score bands", () => {
    const low = calculateOfferValueScore({
      dreamOutcome: 3,
      perceivedLikelihood: 3,
      timeDelay: 8,
      effortAndSacrifice: 9,
    });
    const mid = calculateOfferValueScore({
      dreamOutcome: 7,
      perceivedLikelihood: 7,
      timeDelay: 5,
      effortAndSacrifice: 5,
    });
    const high = calculateOfferValueScore({
      dreamOutcome: 10,
      perceivedLikelihood: 10,
      timeDelay: 2,
      effortAndSacrifice: 2,
    });

    expect(getOfferScoreBand(low.normalizedScore)).toBe("low");
    expect(getOfferScoreBand(mid.normalizedScore)).toBe("mid");
    expect(getOfferScoreBand(high.normalizedScore)).toBe("high");
  });

  it("analyzeValueEquation returns 0-100 scale and rating aligned with normalized 10-pt score", () => {
    const a = analyzeValueEquation({
      dreamOutcome: 10,
      perceivedLikelihood: 10,
      timeDelay: 1,
      effortAndSacrifice: 1,
    });
    expect(a.normalizedScore100).toBe(normalizedValueScoreTo100(a.normalizedScore));
    expect(a.rating).toBe(valueEquationRatingFrom100(a.normalizedScore100));
    expect(a.diagnostics.length).toBeGreaterThanOrEqual(4);
    expect(a.improvementSuggestions.length).toBeGreaterThanOrEqual(1);
  });

  it("analyzeValueEquation labels weak inputs as Weak rating", () => {
    const a = analyzeValueEquation({
      dreamOutcome: 3,
      perceivedLikelihood: 3,
      timeDelay: 8,
      effortAndSacrifice: 9,
    });
    expect(a.normalizedScore).toBeLessThan(5);
    expect(["Weak", "Average"]).toContain(a.rating);
  });
});

