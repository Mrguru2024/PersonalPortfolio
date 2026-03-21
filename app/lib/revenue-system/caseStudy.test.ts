import {
  computeCaseStudyCompleteness,
  emptyCaseStudySections,
  generateCaseStudyFormats,
  slugifyCaseStudy,
} from "@/lib/revenue-system/caseStudy";

describe("caseStudy helpers", () => {
  it("slugifies titles safely", () => {
    expect(slugifyCaseStudy("From Idea to First Users Without Guesswork")).toBe(
      "from-idea-to-first-users-without-guesswork",
    );
  });

  it("computes completeness score from required dimensions", () => {
    const sections = emptyCaseStudySections();
    sections.problem = "Problem section with enough detail to pass threshold.";
    sections.solution = "Solution section with enough detail to pass threshold.";
    sections.results = "Results section with enough detail.";
    sections.visualProof = "Before and after charts.";
    sections.cta = "Run Diagnostic";

    const score = computeCaseStudyCompleteness({
      sections,
      blocks: [],
      ctaLabel: "Run Diagnostic",
      ctaHref: "/revenue-diagnostic",
    });

    expect(score).toBe(100);
  });

  it("generates all required output formats", () => {
    const formats = generateCaseStudyFormats({
      title: "Sample Case Study",
      summary: "Summary text",
      sections: {
        ...emptyCaseStudySections(),
        problem: "Problem",
        diagnosis: "Diagnosis",
        solution: "Solution",
        results: "Results",
        takeaways: "Takeaways",
      },
      ctaLabel: "Book Strategy Call",
      ctaHref: "/strategy-call",
    });

    expect(formats.full).toContain("Sample Case Study");
    expect(formats.short.length).toBeGreaterThan(0);
    expect(formats.social.length).toBeGreaterThan(0);
    expect(formats.email).toContain("Subject:");
    expect(formats.proposal).toContain("Proof snippet");
    expect(formats.landingProof).toContain("Results Snapshot");
  });
});
