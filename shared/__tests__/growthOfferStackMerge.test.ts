import { mergeOfferStackWithPersona } from "@server/services/growthOfferStackMerge";
import { ASCENDRA_OFFER_STACK, formatUsdRange } from "@shared/ascendraOfferStack";
import type { GrowthPersonaOfferPricing } from "@shared/schema";

describe("mergeOfferStackWithPersona", () => {
  it("returns base stack when persona row is null", () => {
    const m = mergeOfferStackWithPersona(null);
    expect(m.DFY.pricing.setup?.minCents).toBe(ASCENDRA_OFFER_STACK.DFY.pricing.setup?.minCents);
  });

  it("multiplies DFY and DWY cent ranges", () => {
    const row = {
      id: 1,
      personaKey: "test",
      label: null,
      dfySetupMultiplier: 1.1,
      dfyMonthlyMultiplier: 1.2,
      dwyProgramMultiplier: 0.9,
      updatedAt: new Date(),
    } satisfies GrowthPersonaOfferPricing;
    const m = mergeOfferStackWithPersona(row);
    expect(m.DFY.pricing.setup).toBeDefined();
    expect(formatUsdRange(m.DFY.pricing.setup)).not.toBe(formatUsdRange(ASCENDRA_OFFER_STACK.DFY.pricing.setup));
    expect(m.DWY.pricing.program).toBeDefined();
  });
});
