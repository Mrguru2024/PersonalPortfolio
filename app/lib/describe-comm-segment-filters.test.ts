import { describeCommSegmentFilters } from "./describe-comm-segment-filters";

describe("describeCommSegmentFilters", () => {
  it("returns friendly lines", () => {
    const lines = describeCommSegmentFilters({ status: "new", excludeDoNotContact: true });
    expect(lines.some((l) => /status/i.test(l))).toBe(true);
  });

  it("handles empty object", () => {
    expect(describeCommSegmentFilters({})).toContain("No audience rules set.");
  });
});
