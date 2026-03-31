/**
 * @jest-environment node
 */
describe('GET /api/changelog', () => {
  it("returns 200 and only fact-checked allowed-category entries sorted newest first", async () => {
    jest.resetModules();
    jest.doMock("fs", () => ({
      existsSync: jest.fn(() => true),
      readFileSync: jest.fn(() =>
        JSON.stringify([
          {
            date: "2026-03-31T10:00:00Z",
            title: "Relevant",
            description: "Allowed and fact checked",
            category: "client_project",
            factChecked: true,
          },
          {
            date: "2026-03-30T10:00:00Z",
            title: "Unverified",
            description: "Should not show",
            category: "site_update",
            factChecked: false,
          },
          {
            date: "2026-03-29T10:00:00Z",
            title: "Wrong category",
            description: "Should not show",
            category: "internal",
            factChecked: true,
          },
          {
            date: "2026-03-28T10:00:00Z",
            title: "Older relevant",
            description: "Allowed and fact checked",
            category: "market_update",
            factChecked: true,
          },
          {
            date: "2026-03-27T10:00:00Z",
            title: "feat: internal rollout wiring",
            description: "Should be blocked as commit style",
            category: "site_update",
            factChecked: true,
          },
          {
            date: "2026-03-26T10:00:00Z",
            title: "Status update",
            description: "Auto · c5fc760",
            category: "client_project",
            factChecked: true,
          },
          {
            date: "2026-03-25T10:00:00Z",
            title: "Client project note",
            description: "Includes commit 46a601a from dev log",
            category: "client_project",
            factChecked: true,
          },
        ]),
      ),
    }));

    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.entries).toEqual([
      {
        date: "2026-03-31T10:00:00.000Z",
        title: "Relevant",
        description: "Allowed and fact checked",
        category: "client_project",
        factChecked: true,
      },
      {
        date: "2026-03-28T10:00:00.000Z",
        title: "Older relevant",
        description: "Allowed and fact checked",
        category: "market_update",
        factChecked: true,
      },
    ]);
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
