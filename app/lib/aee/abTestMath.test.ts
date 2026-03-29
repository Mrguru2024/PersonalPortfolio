import { twoProportionZTest } from "./abTestMath";

describe("twoProportionZTest", () => {
  it("returns null when conversions exceed visitors", () => {
    expect(twoProportionZTest(10, 5, 0, 100)).toBeNull();
  });

  it("returns null when visitors are zero", () => {
    expect(twoProportionZTest(0, 0, 0, 100)).toBeNull();
  });

  it("finds a significant lift for divergent rates with large n", () => {
    const r = twoProportionZTest(100, 1000, 150, 1000);
    expect(r).not.toBeNull();
    expect(r!.rateA).toBeCloseTo(0.1, 5);
    expect(r!.rateB).toBeCloseTo(0.15, 5);
    expect(r!.pValue).toBeLessThan(0.05);
  });
});
