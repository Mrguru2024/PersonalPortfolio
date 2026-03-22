import { getPersonaRevenueBridge, PERSONA_REVENUE_MAP } from "@shared/personaRevenueMap";

describe("personaRevenueMap", () => {
  it("maps every journey id to a bridge with flagship offer", () => {
    const ids = Object.keys(PERSONA_REVENUE_MAP);
    expect(ids.length).toBe(6);
    for (const id of ids) {
      const b = getPersonaRevenueBridge(id as keyof typeof PERSONA_REVENUE_MAP);
      expect(b.flagshipOfferSlug).toBe("startup-growth-system");
      expect(b.primaryLeadMagnetSlug).toBeTruthy();
      expect(b.secondaryLeadMagnetSlug).toBeTruthy();
    }
  });

  it("getPersonaRevenueBridge returns marcus mapping", () => {
    expect(getPersonaRevenueBridge("marcus-trades")).toMatchObject({
      flagshipOfferSlug: "startup-growth-system",
      primaryLeadMagnetSlug: "digital-growth-audit",
    });
  });
});
