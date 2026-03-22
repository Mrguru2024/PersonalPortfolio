/** Count of external http(s) links in HTML (same order as click tracking rewrites). */
export function countExternalHttpLinks(html: string): number {
  if (!html) return 0;
  let n = 0;
  const re = /\shref=["'](https?:\/\/[^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (!/^mailto:|tel:/i.test(m[1])) n += 1;
  }
  return n;
}

/**
 * Map ordered `blocks_json` entries to outbound link index for block-level click analytics.
 * Convention: `blocks_json` is `[{ "id": "hero_cta" }, { "id": "footer_link" }, ...]` in the same order
 * as external `https?://` links appear in `html_content`.
 */
export function buildBlockIdResolverForLinks(blocksJson: unknown): (linkIndex: number) => string | undefined {
  if (!Array.isArray(blocksJson)) return () => undefined;
  const ids: string[] = [];
  for (const item of blocksJson) {
    if (item && typeof item === "object" && "id" in item && typeof (item as { id: unknown }).id === "string") {
      ids.push((item as { id: string }).id);
    }
  }
  return (linkIndex: number) => ids[linkIndex];
}
