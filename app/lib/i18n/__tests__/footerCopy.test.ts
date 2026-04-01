import { footerLinkLabel, footerPrimaryCta, footerSectionTitle } from "../footerCopy";

describe("footerCopy", () => {
  it("translates known footer link hrefs to Spanish", () => {
    expect(footerLinkLabel("/", "Home", "es")).toBe("Inicio");
    expect(footerLinkLabel("/unknown", "Fallback", "es")).toBe("Fallback");
  });

  it("leaves English labels for en locale", () => {
    expect(footerLinkLabel("/", "Home", "en")).toBe("Home");
  });

  it("footerPrimaryCta matches funnel English and provides Spanish", () => {
    expect(footerPrimaryCta("en")).toContain("Audit");
    expect(footerPrimaryCta("es")).toMatch(/auditoría/i);
  });

  it("footerSectionTitle", () => {
    expect(footerSectionTitle("main", "en")).toBe("Main");
    expect(footerSectionTitle("main", "es")).toBe("Principal");
  });
});
