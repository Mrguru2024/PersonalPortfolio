/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const mockGetSessionUser = jest.fn();
const mockGetClientPortalEligibility = jest.fn();
const mockBuildClientGrowthSnapshot = jest.fn();
const mockGetCachedClientGrowthSnapshot = jest.fn();
const mockUpsertClientGrowthSnapshotCache = jest.fn();

jest.mock("@/lib/auth-helpers", () => ({
  getSessionUser: (...args: unknown[]) => mockGetSessionUser(...args),
}));
jest.mock("@server/storage", () => ({
  storage: {
    getClientPortalEligibility: (...args: unknown[]) => mockGetClientPortalEligibility(...args),
  },
}));
jest.mock("@server/services/clientGrowth/buildClientGrowthSnapshot", () => ({
  buildClientGrowthSnapshot: (...args: unknown[]) => mockBuildClientGrowthSnapshot(...args),
}));
jest.mock("@server/services/clientGrowth/clientGrowthSnapshotCache", () => ({
  getCachedClientGrowthSnapshot: (...args: unknown[]) => mockGetCachedClientGrowthSnapshot(...args),
  upsertClientGrowthSnapshotCache: (...args: unknown[]) => mockUpsertClientGrowthSnapshotCache(...args),
}));

function mkReq() {
  return new NextRequest("http://localhost/api/client/growth-snapshot", { method: "GET" });
}

/** Minimal snapshot satisfied by clientGrowthSnapshotSchema (kept in sync manually for tests). */
function minimalSnapshot() {
  return {
    businessLabel: "Test Co",
    growthStatusLine: "Stage 1 — See what's holding back growth.",
    step: {
      diagnose: "not_started" as const,
      build: "locked" as const,
      scale: "locked" as const,
      current: 1 as const,
    },
    diagnose: {
      healthScore0to100: null,
      statusSummary: "We haven't scored your full picture yet.",
      primaryIssue: "Clarity between what you offer and how easy it is to book you online.",
      missedOpportunityHint: "Small improvements help.",
      market: { label: "Not measured yet", summary: "Run a diagnostic." },
      website: { label: "Not measured yet", summary: "Run a diagnostic." },
      offer: { label: "Not measured yet", summary: "Run a diagnostic." },
      nextCta: { label: "Run the growth diagnosis", href: "/growth-diagnosis" },
    },
    build: {
      activationSummary: "We're assembling the pieces.",
      funnel: [{ label: "Funnel", status: "pending" as const }],
      messaging: [{ label: "Messaging", status: "pending" as const }],
      capture: [{ label: "Capture", status: "pending" as const }],
      followUp: [{ label: "Follow-up", status: "pending" as const }],
      nextCta: { label: "Open your dashboard", href: "/dashboard" },
    },
    scale: {
      leadsThisWeekApprox: null,
      bookingsCount: null,
      topChannelLabel: null,
      trendHint: "Once we track more leads, your top channel will show up here.",
      improvementBullets: ["Keep asking customers how they found you."],
      nextCta: { label: "Book a strategy check-in", href: "/strategy-call" },
    },
    activity: [],
  };
}

describe("GET /api/client/growth-snapshot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCachedClientGrowthSnapshot.mockResolvedValue(null);
    mockUpsertClientGrowthSnapshotCache.mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    const { GET } = await import("../route");
    const res = await GET(mkReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/sign in/i);
    expect(mockBuildClientGrowthSnapshot).not.toHaveBeenCalled();
  });

  it("returns 403 when not eligible for client portal", async () => {
    mockGetSessionUser.mockResolvedValue({ id: 42 });
    mockGetClientPortalEligibility.mockResolvedValue(false);
    const { GET } = await import("../route");
    const res = await GET(mkReq());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(String(body.error)).toContain("not available");
    expect(mockBuildClientGrowthSnapshot).not.toHaveBeenCalled();
  });

  it("returns 200 and JSON snapshot when eligible", async () => {
    mockGetSessionUser.mockResolvedValue({ id: 7 });
    mockGetClientPortalEligibility.mockResolvedValue(true);
    mockBuildClientGrowthSnapshot.mockResolvedValue(minimalSnapshot());
    const { GET } = await import("../route");
    const res = await GET(mkReq());
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("private");
    const body = await res.json();
    expect(body.businessLabel).toBe("Test Co");
    expect(body.step.current).toBe(1);
    expect(mockBuildClientGrowthSnapshot).toHaveBeenCalledWith(7);
    expect(mockUpsertClientGrowthSnapshotCache).toHaveBeenCalledWith(7, expect.objectContaining({ businessLabel: "Test Co" }));
  });

  it("returns cached snapshot without rebuilding when cache hits", async () => {
    mockGetSessionUser.mockResolvedValue({ id: 99 });
    mockGetClientPortalEligibility.mockResolvedValue(true);
    mockGetCachedClientGrowthSnapshot.mockResolvedValue(minimalSnapshot());
    const { GET } = await import("../route");
    const res = await GET(mkReq());
    expect(res.status).toBe(200);
    expect(mockBuildClientGrowthSnapshot).not.toHaveBeenCalled();
    expect(mockUpsertClientGrowthSnapshotCache).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.businessLabel).toBe("Test Co");
  });
});
