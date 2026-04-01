/** Pull lightweight metadata from rrweb event stream for replay chrome. */

const RRWEB_META = 4;

export function extractReplayMeta(events: unknown[]): {
  href: string | null;
  pathLabel: string | null;
} {
  for (const ev of events) {
    if (!ev || typeof ev !== "object") continue;
    const e = ev as { type?: number; data?: { href?: string } };
    if (e.type === RRWEB_META && typeof e.data?.href === "string" && e.data.href.trim()) {
      const href = e.data.href.trim();
      try {
        const u = new URL(href);
        return { href, pathLabel: `${u.pathname}${u.search}` || "/" };
      } catch {
        return { href, pathLabel: href };
      }
    }
  }
  return { href: null, pathLabel: null };
}
