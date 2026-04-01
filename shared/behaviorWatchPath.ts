/** Shared URL path prefix rules for Behavior watch targets (browser + server). */

export function normalizePathPattern(raw: string): string {
  const t = raw.trim() || "/";
  return t.startsWith("/") ? t : `/${t}`;
}

/** `/` matches all; `/a` matches `/a` and `/a/b` but not `/about`. */
export function pathMatchesPathPattern(pathname: string, pattern: string): boolean {
  const p = normalizePathPattern(pattern);
  if (p === "/") return true;
  return pathname === p || pathname.startsWith(`${p}/`);
}
