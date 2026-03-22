import { resolvePersonaCaseStudyProjects, projectCaseStudyPath } from "./personaCaseStudies";

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
});
