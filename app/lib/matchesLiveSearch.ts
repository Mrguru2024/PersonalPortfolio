import {
  parseAdvancedSearchQuery,
  haystackMatchesParsedQuery,
  isParsedQueryEmpty,
} from "./advancedSearchQuery";

/**
 * Live list filtering: quoted phrases and unquoted tokens; every phrase and token
 * must appear as a substring in the combined fields (case-insensitive). Empty query matches all.
 */
export function matchesLiveSearch(
  query: string,
  parts: (string | null | undefined | number | boolean)[],
): boolean {
  const parsed = parseAdvancedSearchQuery(query);
  if (isParsedQueryEmpty(parsed)) return true;
  const hay = parts
    .filter((p) => p != null && p !== "")
    .map((p) => String(p).toLowerCase())
    .join(" ");
  return haystackMatchesParsedQuery(hay, parsed);
}
