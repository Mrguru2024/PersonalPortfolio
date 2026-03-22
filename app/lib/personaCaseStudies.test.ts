import {
  resolvePersonaCaseStudyProjects,
  projectCaseStudyPath,
  getPersonaEcosystemSpotlight,
  journeyIdHash,
} from "./personaCaseStudies";

describe("personaCaseStudies", () => {
  it("resolvePersonaCaseStudyProjects returns projects in ref order", () => {
    const out = resolvePersonaCaseStudyProjects(["keycode-help", "ssi-met-repairs"]);
    expect(out.map((p) => p.id)).toEqual(["keycode-help", "ssi-met-repairs"]);
  });

  it("skips unknown ids", () => {
    const out = resolvePersonaCaseStudyProjects(["keycode-help", "no-such-project"]);
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe("keycode-help");
  });

  it("projectCaseStudyPath encodes id", () => {
    expect(projectCaseStudyPath("keycode-help")).toBe("/projects/keycode-help");
  });

  it("journeyIdHash is stable for the same id", () => {
    expect(journeyIdHash("high-ticket-owner")).toBe(journeyIdHash("high-ticket-owner"));
  });

  it("getPersonaEcosystemSpotlight returns Ascendra + Macon + Style and stable picks per journey", () => {
    const a = getPersonaEcosystemSpotlight("high-ticket-owner", ["the-unauthorized-author", "stackzen"]);
    const b = getPersonaEcosystemSpotlight("high-ticket-owner", ["the-unauthorized-author", "stackzen"]);
    expect(a.ascendra.id).toBe("the-unauthorized-author");
    expect(a.ascendraMore.map((p) => p.id)).toEqual(["stackzen"]);
    expect(a.macon.id).toBe(b.macon.id);
    expect(a.styleStudio.id).toBe(b.styleStudio.id);
    expect(a.macon.title).toBeTruthy();
    expect(a.styleStudio.title).toBeTruthy();
  });

  it("getPersonaEcosystemSpotlight varies Macon picks across journeys", () => {
    const picks = ["high-ticket-owner", "marcus-trades", "tax-business-owner"].map(
      (id) => getPersonaEcosystemSpotlight(id, undefined).macon.id,
    );
    expect(new Set(picks).size).toBeGreaterThanOrEqual(2);
  });
});
