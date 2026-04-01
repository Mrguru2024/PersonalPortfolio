import { normalizePathPattern, pathMatchesPathPattern } from "../behaviorWatchPath";

describe("behaviorWatchPath", () => {
  it("normalizes patterns", () => {
    expect(normalizePathPattern("")).toBe("/");
    expect(normalizePathPattern("foo")).toBe("/foo");
    expect(normalizePathPattern("/bar")).toBe("/bar");
  });

  it("matches path prefixes", () => {
    expect(pathMatchesPathPattern("/pricing", "/")).toBe(true);
    expect(pathMatchesPathPattern("/pricing", "/pricing")).toBe(true);
    expect(pathMatchesPathPattern("/pricing/plans", "/pricing")).toBe(true);
    expect(pathMatchesPathPattern("/about", "/pricing")).toBe(false);
    expect(pathMatchesPathPattern("/pricing-extra", "/pricing")).toBe(false);
  });
});
