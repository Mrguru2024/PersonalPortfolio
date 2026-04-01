import { clientGrowthSnapshotSchema } from "../clientGrowthSnapshot";

describe("clientGrowthSnapshotSchema", () => {
  it("parses a minimal valid snapshot", () => {
    const parsed = clientGrowthSnapshotSchema.parse({
      businessLabel: "Acme",
      growthStatusLine: "Stage 2 — Your system is taking shape.",
      step: {
        diagnose: "complete",
        build: "in_progress",
        scale: "locked",
        current: 2,
      },
      diagnose: {
        healthScore0to100: 55,
        statusSummary: "Summary",
        primaryIssue: "Issue",
        missedOpportunityHint: "Hint",
        market: { label: "Mixed", summary: "Market" },
        website: { label: "Strong", summary: "Site" },
        offer: { label: "Mixed", summary: "Offer" },
        nextCta: { label: "Next", href: "/growth-diagnosis" },
      },
      build: {
        activationSummary: "Activating",
        funnel: [{ label: "A", status: "active" }],
        messaging: [{ label: "B", status: "pending" }],
        capture: [{ label: "C", status: "in_progress" }],
        followUp: [{ label: "D", status: "done" }],
        nextCta: { label: "Scale", href: "#scale" },
      },
      scale: {
        leadsThisWeekApprox: 2,
        bookingsCount: 1,
        topChannelLabel: "Organic",
        trendHint: "Trend",
        improvementBullets: ["Do X"],
        nextCta: { label: "Call", href: "/strategy-call" },
      },
      activity: [{ title: "Note", at: "2025-01-15T12:00:00.000Z", kind: "note" }],
    });
    expect(parsed.businessLabel).toBe("Acme");
    expect(parsed.step.current).toBe(2);
  });

  it("parses diagnose.amie when present", () => {
    const base = {
      businessLabel: "Co",
      growthStatusLine: "L",
      step: { diagnose: "complete", build: "active", scale: "locked", current: 2 as const },
      diagnose: {
        healthScore0to100: null,
        statusSummary: "s",
        primaryIssue: "p",
        missedOpportunityHint: "m",
        market: { label: "a", summary: "b" },
        website: { label: "a", summary: "b" },
        offer: { label: "a", summary: "b" },
        nextCta: { label: "n", href: "/" },
        amie: {
          summaryLine: "Summary",
          opportunityHeadline: "Headline",
          insightBullets: ["One", "Two"],
          demandVsCompetitionHint: "Hint",
        },
      },
      build: {
        activationSummary: "a",
        funnel: [{ label: "x", status: "unknown" as const }],
        messaging: [{ label: "x", status: "unknown" as const }],
        capture: [{ label: "x", status: "unknown" as const }],
        followUp: [{ label: "x", status: "unknown" as const }],
        nextCta: { label: "n", href: "/" },
      },
      scale: {
        leadsThisWeekApprox: null,
        bookingsCount: null,
        topChannelLabel: null,
        trendHint: "t",
        improvementBullets: [],
        nextCta: { label: "n", href: "/" },
      },
      activity: [],
    };
    const parsed = clientGrowthSnapshotSchema.parse(base);
    expect(parsed.diagnose.amie?.insightBullets).toEqual(["One", "Two"]);
  });

  it("rejects invalid step.current", () => {
    expect(() =>
      clientGrowthSnapshotSchema.parse({
        businessLabel: "X",
        growthStatusLine: "L",
        step: { diagnose: "locked", build: "locked", scale: "locked", current: 5 },
        diagnose: {
          healthScore0to100: null,
          statusSummary: "s",
          primaryIssue: "p",
          missedOpportunityHint: "m",
          market: { label: "a", summary: "b" },
          website: { label: "a", summary: "b" },
          offer: { label: "a", summary: "b" },
          nextCta: { label: "n", href: "/" },
        },
        build: {
          activationSummary: "a",
          funnel: [{ label: "x", status: "unknown" }],
          messaging: [{ label: "x", status: "unknown" }],
          capture: [{ label: "x", status: "unknown" }],
          followUp: [{ label: "x", status: "unknown" }],
          nextCta: { label: "n", href: "/" },
        },
        scale: {
          leadsThisWeekApprox: null,
          bookingsCount: null,
          topChannelLabel: null,
          trendHint: "t",
          improvementBullets: [],
          nextCta: { label: "n", href: "/" },
        },
        activity: [],
      }),
    ).toThrow();
  });
});
