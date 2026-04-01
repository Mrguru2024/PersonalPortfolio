/**
 * @jest-environment node
 */
import {
  absoluteFromSiteBase,
  ensureAbsoluteUrl,
  getSiteBaseUrl,
  getSiteOriginForMetadata,
} from "../siteUrl";

describe("ensureAbsoluteUrl", () => {
  it("returns URL unchanged when it already has https://", () => {
    expect(ensureAbsoluteUrl("https://example.com")).toBe("https://example.com");
    expect(ensureAbsoluteUrl("https://www.ascendra.tech")).toBe("https://www.ascendra.tech");
  });

  it("returns URL unchanged when it already has http://", () => {
    expect(ensureAbsoluteUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("adds https:// when scheme is missing", () => {
    expect(ensureAbsoluteUrl("www.ascendra.tech")).toBe("https://www.ascendra.tech");
    expect(ensureAbsoluteUrl("example.com")).toBe("https://example.com");
  });

  it("adds http:// for localhost", () => {
    expect(ensureAbsoluteUrl("localhost")).toBe("http://localhost");
    expect(ensureAbsoluteUrl("localhost:3000")).toBe("http://localhost:3000");
  });

  it("trims trailing slashes before normalizing", () => {
    expect(ensureAbsoluteUrl("www.ascendra.tech/")).toBe("https://www.ascendra.tech");
  });

  it("trims whitespace", () => {
    expect(ensureAbsoluteUrl("  https://example.com  ")).toBe("https://example.com");
  });

  it("is case-insensitive for scheme detection", () => {
    expect(ensureAbsoluteUrl("HTTPS://example.com")).toBe("HTTPS://example.com");
  });
});

describe("getSiteBaseUrl", () => {
  it("returns a non-empty string", () => {
    const url = getSiteBaseUrl();
    expect(typeof url).toBe("string");
    expect(url.length).toBeGreaterThan(0);
  });
});

describe("absoluteFromSiteBase", () => {
  it("joins path and preserves absolute URLs", () => {
    expect(absoluteFromSiteBase("https://a.com", "/x.png")).toBe("https://a.com/x.png");
    expect(absoluteFromSiteBase("https://a.com", "https://cdn/x.png")).toBe("https://cdn/x.png");
    expect(absoluteFromSiteBase("https://a.com", "")).toBe("https://a.com/og-ascendra.png");
  });
});

describe("getSiteOriginForMetadata", () => {
  const keys = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_BASE_URL",
    "VERCEL_PROJECT_PRODUCTION_URL",
    "VERCEL_URL",
  ] as const;

  function clearUrlEnv() {
    for (const k of keys) {
      delete process.env[k];
    }
  }

  afterEach(() => {
    clearUrlEnv();
  });

  it("prefers NEXT_PUBLIC_APP_URL when set", () => {
    clearUrlEnv();
    process.env.NEXT_PUBLIC_APP_URL = "https://primary.example";
    expect(getSiteOriginForMetadata()).toBe("https://primary.example");
  });

  it("uses VERCEL_URL with https when no public URL", () => {
    clearUrlEnv();
    process.env.VERCEL_URL = "my-app.vercel.app";
    expect(getSiteOriginForMetadata()).toBe("https://my-app.vercel.app");
  });
});
