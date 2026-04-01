import {
  clientLocationMatchesWatchTarget,
  coerceHttpUrl,
  normalizeFullUrlPrefix,
} from "../ascendraOsWatchScope";

describe("ascendraOsWatchScope", () => {
  it("coerces URLs without scheme", () => {
    const u = coerceHttpUrl("example.com/foo");
    expect(u?.href).toContain("https://example.com/foo");
  });

  it("normalizes full URL prefix", () => {
    expect(normalizeFullUrlPrefix("https://x.com/bar/")).toBe("https://x.com/bar");
    expect(normalizeFullUrlPrefix("https://x.com")).toBe("https://x.com");
  });

  it("matches client location with full URL prefix", () => {
    expect(
      clientLocationMatchesWatchTarget("https://x.com/bar?q=1", "/other", {
        pathPattern: "/",
        fullUrlPrefix: "https://x.com/bar",
      }),
    ).toBe(true);
    expect(
      clientLocationMatchesWatchTarget("https://x.com/baz", "/baz", {
        pathPattern: "/",
        fullUrlPrefix: "https://x.com/bar",
      }),
    ).toBe(false);
  });

  it("falls back to path when only path pattern", () => {
    expect(
      clientLocationMatchesWatchTarget("https://x.com/pricing", "/pricing", {
        pathPattern: "/pricing",
        fullUrlPrefix: null,
      }),
    ).toBe(true);
  });
});
