import {
  parseAdvancedSearchQuery,
  haystackMatchesParsedQuery,
  stripConversationalSearchNoise,
  isParsedQueryEmpty,
} from "./advancedSearchQuery";

describe("parseAdvancedSearchQuery", () => {
  it("treats quoted segments as phrases and rest as tokens", () => {
    expect(parseAdvancedSearchQuery(`crm "lead intake" newsletter`)).toEqual({
      phrases: ["lead intake"],
      tokens: ["crm", "newsletter"],
    });
  });

  it("supports multiple phrases and normalizes inner spaces", () => {
    expect(parseAdvancedSearchQuery(`"growth  os" hub`)).toEqual({
      phrases: ["growth os"],
      tokens: ["hub"],
    });
  });

  it("returns empty for whitespace-only", () => {
    const q = parseAdvancedSearchQuery("  \n  ");
    expect(isParsedQueryEmpty(q)).toBe(true);
  });

  it("handles escaped quote inside phrase", () => {
    expect(parseAdvancedSearchQuery(`"say \\"hi\\""`)).toEqual({
      phrases: ['say "hi"'],
      tokens: [],
    });
  });
});

describe("haystackMatchesParsedQuery", () => {
  const hay = "admin crm contact lead intake unified".toLowerCase();

  it("requires full phrase match", () => {
    expect(
      haystackMatchesParsedQuery(hay, { phrases: ["lead intake"], tokens: [] }),
    ).toBe(true);
    expect(
      haystackMatchesParsedQuery(hay, { phrases: ["intake lead"], tokens: [] }),
    ).toBe(false);
  });

  it("requires phrase and tokens", () => {
    expect(
      haystackMatchesParsedQuery(hay, { phrases: ["lead intake"], tokens: ["admin"] }),
    ).toBe(true);
    expect(
      haystackMatchesParsedQuery(hay, { phrases: ["lead intake"], tokens: ["blog"] }),
    ).toBe(false);
  });
});

describe("stripConversationalSearchNoise", () => {
  it("removes where/open/find style prefixes", () => {
    expect(stripConversationalSearchNoise("Where is the lead intake page?")).toBe("lead intake page");
    expect(stripConversationalSearchNoise("open content studio calendar")).toBe("content studio calendar");
    expect(stripConversationalSearchNoise("please find CRM import")).toBe("CRM import");
  });
});
