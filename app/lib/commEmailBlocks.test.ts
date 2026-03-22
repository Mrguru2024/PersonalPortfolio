import { buildBlockIdResolverForLinks, countExternalHttpLinks } from "./commEmailBlocks";

describe("countExternalHttpLinks", () => {
  it("counts https links and skips mailto", () => {
    const html = `<p><a href="https://a.com/x">A</a> <a href="mailto:x@y.com">E</a> <a href='https://b.com'>B</a></p>`;
    expect(countExternalHttpLinks(html)).toBe(2);
  });
});

describe("buildBlockIdResolverForLinks", () => {
  it("maps link index to block id from blocks_json", () => {
    const r = buildBlockIdResolverForLinks([{ id: "hero" }, { id: "cta" }]);
    expect(r(0)).toBe("hero");
    expect(r(1)).toBe("cta");
    expect(r(2)).toBeUndefined();
  });

  it("returns undefined when blocks missing", () => {
    const r = buildBlockIdResolverForLinks(null);
    expect(r(0)).toBeUndefined();
  });
});
