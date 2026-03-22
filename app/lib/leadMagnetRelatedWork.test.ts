import {
  LEAD_MAGNET_RELATED_WORK_KEYS,
  resolveLeadMagnetRelatedWork,
} from "./leadMagnetRelatedWork";

describe("leadMagnetRelatedWork", () => {
  it("every key resolves at least one partner or Ascendra project", () => {
    for (const key of LEAD_MAGNET_RELATED_WORK_KEYS) {
      const bundle = resolveLeadMagnetRelatedWork(key);
      const n = bundle.ascendra.length + bundle.macon.length + bundle.styleStudio.length;
      expect(n).toBeGreaterThan(0);
    }
  });

  it("each bundle includes two Macon and two Style Studio picks when pools have multiple items", () => {
    const b = resolveLeadMagnetRelatedWork("digital-growth-audit");
    expect(b.macon).toHaveLength(2);
    expect(b.styleStudio).toHaveLength(2);
    expect(b.ascendra.length).toBeGreaterThanOrEqual(1);
  });

  it("same key is stable across calls", () => {
    const a = resolveLeadMagnetRelatedWork("revenue-calculator");
    const b = resolveLeadMagnetRelatedWork("revenue-calculator");
    expect(a.ascendra.map((p) => p.id)).toEqual(b.ascendra.map((p) => p.id));
    expect(a.macon.map((p) => p.id)).toEqual(b.macon.map((p) => p.id));
    expect(a.styleStudio.map((p) => p.id)).toEqual(b.styleStudio.map((p) => p.id));
  });

  it("rotation varies first Macon pick across keys", () => {
    const firstMaconIds = LEAD_MAGNET_RELATED_WORK_KEYS.map(
      (key) => resolveLeadMagnetRelatedWork(key).macon[0]?.id,
    );
    expect(new Set(firstMaconIds).size).toBeGreaterThanOrEqual(2);
  });
});
