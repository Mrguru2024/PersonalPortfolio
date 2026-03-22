import { buildManualSocialSearchLinks, detectSocialPlatformFromUrl, normalizeSocialProfileUrl } from "./social-profile-discovery";

describe("social-profile-discovery", () => {
  it("detects LinkedIn profile URLs", () => {
    expect(detectSocialPlatformFromUrl("https://www.linkedin.com/in/jane-doe")).toBe("linkedin");
  });

  it("detects X URLs", () => {
    expect(detectSocialPlatformFromUrl("https://x.com/acme")).toBe("x");
    expect(detectSocialPlatformFromUrl("https://twitter.com/acme")).toBe("x");
  });

  it("normalizes URLs and strips tracking params", () => {
    const n = normalizeSocialProfileUrl("http://linkedin.com/in/foo/?utm_source=foo");
    expect(n).toBe("https://linkedin.com/in/foo");
  });

  it("builds manual search links from lead context", () => {
    const links = buildManualSocialSearchLinks({ name: "Alex Kim", company: "Acme", jobTitle: "CTO" });
    expect(links).toHaveLength(3);
    expect(links[0].url).toContain("duckduckgo.com");
    expect(links[0].url).toContain(encodeURIComponent("Alex Kim"));
  });
});
