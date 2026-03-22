/**
 * Live list filtering: whitespace-separated tokens; every token must appear as a
 * substring somewhere in the combined fields (case-insensitive). Empty query matches all.
 */
export function matchesLiveSearch(
  query: string,
  parts: (string | null | undefined | number | boolean)[],
): boolean {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const hay = parts
    .filter((p) => p != null && p !== "")
    .map((p) => String(p).toLowerCase())
    .join(" ");
  return tokens.every((t) => hay.includes(t));
}
