/**
 * @jest-environment node
 */
import { ensureAbsoluteUrl, getSiteBaseUrl } from "../siteUrl";

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
