import { searchSiteDirectory } from "./siteDirectory";

describe("searchSiteDirectory", () => {
  it("ranks lead intake page high for phrase lead intake", () => {
    const hits = searchSiteDirectory('"lead intake"');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].path).toBe("/admin/lead-intake");
  });

  it("narrows combined tokens and phrase vs token-only noise", () => {
    const phraseFirst = searchSiteDirectory('"email sequences"');
    const tokenWide = searchSiteDirectory("email sequences");
    expect(phraseFirst.length).toBeLessThanOrEqual(tokenWide.length);
    expect(phraseFirst[0]?.path).toContain("sequences");
  });
});
