/**
 * @jest-environment node
 */
describe("GET /api/admin/updates", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock("fs");
  });

  it("returns 403 when caller is not admin", async () => {
    jest.doMock("@/lib/auth-helpers", () => ({
      isAdmin: jest.fn(async () => false),
    }));

    const { GET } = await import("../route");
    const res = await GET({} as any);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.message).toBe("Admin access required");
  });

  it("returns only valid internal updates sorted newest first", async () => {
    jest.doMock("@/lib/auth-helpers", () => ({
      isAdmin: jest.fn(async () => true),
    }));
    jest.doMock("fs", () => ({
      existsSync: jest.fn(() => true),
      readFileSync: jest.fn(() =>
        JSON.stringify([
          {
            date: "2026-03-31T10:00:00Z",
            title: "Valid project note",
            description: "Non-technical project summary",
            category: "project_update",
            audience: "admin_only",
          },
          {
            date: "2026-03-30T10:00:00Z",
            title: "Wrong audience",
            description: "Should be filtered",
            category: "project_update",
            audience: "public",
          },
          {
            date: "2026-03-29T10:00:00Z",
            title: "Wrong category",
            description: "Should be filtered",
            category: "something_else",
            audience: "admin_only",
          },
          {
            date: "2026-03-28T10:00:00Z",
            title: "Valid market note",
            description: "Agency market data summary",
            category: "agency_market_data",
            audience: "admin_only",
          },
        ]),
      ),
    }));

    const { GET } = await import("../route");
    const res = await GET({} as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.entries).toEqual([
      {
        date: "2026-03-31T10:00:00.000Z",
        title: "Valid project note",
        description: "Non-technical project summary",
        category: "project_update",
        audience: "admin_only",
      },
      {
        date: "2026-03-28T10:00:00.000Z",
        title: "Valid market note",
        description: "Agency market data summary",
        category: "agency_market_data",
        audience: "admin_only",
      },
    ]);
  });

  it("returns entries array when internal source read fails", async () => {
    jest.doMock("@/lib/auth-helpers", () => ({
      isAdmin: jest.fn(async () => true),
    }));
    jest.doMock("fs", () => ({
      existsSync: jest.fn(() => {
        throw new Error("boom");
      }),
      readFileSync: jest.fn(),
    }));

    const { GET } = await import("../route");
    const res = await GET({} as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.entries).toEqual([]);
    expect(data.error).toBeDefined();
  });
});
