import { matchesLiveSearch } from "./matchesLiveSearch";

describe("matchesLiveSearch", () => {
  it("matches when all unquoted tokens appear", () => {
    expect(matchesLiveSearch("crm leads", ["CRM home", "leads", "x"])).toBe(true);
    expect(matchesLiveSearch("crm blog", ["CRM home", "leads"])).toBe(false);
  });

  it("requires quoted phrase as contiguous substring", () => {
    expect(matchesLiveSearch('"lead intake"', ["Lead intake", "admin", "other"])).toBe(true);
    // Joined hay must not contain the contiguous substring "lead intake"
    expect(matchesLiveSearch('"lead intake"', ["something lead", "x", "prefix intake"])).toBe(false);
  });

  it("combines phrases and tokens", () => {
    expect(
      matchesLiveSearch('admin "saved lists"', ["/admin/crm/saved-lists", "Saved lists", "admin"]),
    ).toBe(true);
  });
});
