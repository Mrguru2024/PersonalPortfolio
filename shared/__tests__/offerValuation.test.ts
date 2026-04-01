import {
  calculateOfferValueScore,
  getOfferScoreBand,
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
});

