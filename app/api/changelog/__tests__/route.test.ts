/**
 * @jest-environment node
 */

jest.mock("@/lib/publicUpdates/curatedFeeds", () => ({
  fetchCuratedFeedItems: jest.fn().mockResolvedValue([]),
}));

describe("GET /api/changelog", () => {
  it("returns 200 and only fact-checked allowed-category Ascendra rows plus empty feeds (mocked), newest first", async () => {
    jest.resetModules();
    jest.doMock("fs", () => ({
      existsSync: jest.fn(() => true),
      readFileSync: jest.fn(() =>
        JSON.stringify([
          {
            date: "2026-03-31T10:00:00Z",
            title: "Relevant",
            description: "Allowed and fact checked",
            category: "new_project_intake",
            visibility: "public",
            factChecked: true,
          },
          {
            date: "2026-03-30T10:00:00Z",
            title: "Unverified",
            description: "Should not show",
            category: "marketing_industry_update",
            visibility: "public",
            factChecked: false,
          },
          {
            date: "2026-03-29T10:00:00Z",
            title: "Wrong category",
            description: "Should not show",
            category: "internal",
            visibility: "public",
            factChecked: true,
          },
          {
            date: "2026-03-28T10:00:00Z",
            title: "Older relevant",
            description: "Allowed and fact checked",
            category: "persona_interest",
            visibility: "public",
            factChecked: true,
          },
          {
            date: "2026-03-27T10:00:00Z",
            title: "feat: internal rollout wiring",
            description: "Should be blocked as commit style",
            category: "marketing_industry_update",
            visibility: "public",
            factChecked: true,
          },
          {
            date: "2026-03-26T10:00:00Z",
            title: "Status update",
            description: "Auto · c5fc760",
            category: "new_project_intake",
            visibility: "public",
            factChecked: true,
          },
          {
            date: "2026-03-25T10:00:00Z",
            title: "Client project note",
            description: "Includes commit 46a601a from dev log",
            category: "new_project_intake",
            visibility: "public",
            factChecked: true,
          },
          {
            date: "2026-03-24T10:00:00Z",
            title: "Development updates digest published",
            description: "Should never appear publicly",
            category: "marketing_industry_update",
            visibility: "public",
            factChecked: true,
          },
          {
            date: "2026-03-23T10:00:00Z",
            title: "Missing visibility field",
            description: "Should be filtered out",
            category: "persona_interest",
            factChecked: true,
          },
        ]),
      ),
    }));

    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.entries)).toBe(true);
    expect(data.entries).toHaveLength(2);
    expect(data.refreshedAt).toBeDefined();
    expect(data.entries[0]).toMatchObject({
      title: "Relevant",
      description: "Allowed and fact checked",
      topic: "ascendra_public",
      factChecked: true,
      sourceName: "Ascendra",
      kind: "ascendra_editorial",
      visibility: "public",
    });
    expect(data.entries[0].id).toMatch(/^ascendra:/);
    expect(data.entries[1]).toMatchObject({
      title: "Older relevant",
      topic: "ascendra_public",
      category: "persona_interest",
    });
  });

  it("returns entries array even when source read throws", async () => {
    jest.resetModules();
    jest.doMock("fs", () => ({
      existsSync: jest.fn(() => {
        throw new Error("boom");
      }),
      readFileSync: jest.fn(),
    }));
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.entries).toEqual([]);
    expect(data.error).toBeDefined();
  });

  it("sets no-store cache headers for freshness", async () => {
    jest.resetModules();
    jest.doMock("fs", () => ({
      existsSync: jest.fn(() => true),
      readFileSync: jest.fn(() => JSON.stringify([])),
    }));
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.headers.get("Cache-Control")).toBe("no-store, max-age=0");
  });
});
