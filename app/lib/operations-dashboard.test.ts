import {
  deriveRecommendedSystem,
  deriveRevenueOpportunity,
  evaluateContentReadiness,
  isCaseStudyDocument,
  type OperationsDocumentRecord,
} from "./operations-dashboard";

function makeDoc(overrides: Partial<OperationsDocumentRecord> = {}): OperationsDocumentRecord {
  return {
    id: 1,
    title: "Case Study: Lead Intake Overhaul",
    contentType: "blog_draft",
    workflowStatus: "draft",
    visibility: "internal_only",
    slug: "lead-intake-overhaul",
    excerpt: "How we improved lead quality and conversion outcomes with clearer qualification paths.",
    bodyHtml:
      "<p>We improved conversion by 37% and increased qualified leads.</p><img src='/chart.png' alt='results' /><p>Book a strategy call.</p>",
    bodyMarkdown: null,
    tags: ["case_study", "proof"],
    categories: ["operations"],
    personaTags: ["local_service"],
    updatedAt: "2026-03-23T12:00:00.000Z",
    ...overrides,
  };
}

describe("operations-dashboard helpers", () => {
  test("detects case study documents from metadata and content", () => {
    expect(isCaseStudyDocument(makeDoc())).toBe(true);
    expect(
      isCaseStudyDocument(
        makeDoc({
          title: "Weekly social caption",
          bodyHtml: "<p>Just another short form post.</p>",
          tags: ["social"],
          categories: [],
        }),
      ),
    ).toBe(false);
  });

  test("computes content readiness checks and score", () => {
    const ready = evaluateContentReadiness(makeDoc());
    expect(ready.completionScore).toBe(100);
    expect(ready.missingElements).toEqual([]);

    const incomplete = evaluateContentReadiness(
      makeDoc({
        title: "Short",
        slug: null,
        excerpt: "Too short",
        bodyHtml: "<p>General update with no outcomes listed.</p>",
      }),
    );
    expect(incomplete.completionScore).toBeLessThan(100);
    expect(incomplete.missingElements).toContain("Missing headline");
    expect(incomplete.missingElements).toContain("Missing SEO");
  });

  test("maps score bands to revenue opportunity labels", () => {
    expect(deriveRevenueOpportunity(44)).toBe("High");
    expect(deriveRevenueOpportunity(68)).toBe("Medium");
    expect(deriveRevenueOpportunity(88)).toBe("Low");
    expect(deriveRevenueOpportunity(null)).toBe("Unknown");
  });

  test("maps goal/blocker data to recommended systems", () => {
    expect(
      deriveRecommendedSystem({
        primaryGoal: "increase_bookings",
      }),
    ).toBe("Booking Conversion System");

    expect(
      deriveRecommendedSystem({
        topBlockerTitle: "No clear CTA above the fold",
      }),
    ).toBe("Offer + Conversion System");
  });
});
