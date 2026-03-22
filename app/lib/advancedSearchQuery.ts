/**
 * Shared query parsing for admin list filters, site directory, and agent fallback search.
 * - Double-quoted segments are required phrases (substring match, case-insensitive).
 * - Unquoted whitespace-separated segments are tokens (each must appear somewhere).
 * - Example: crm "lead intake" finds rows containing both "crm" and the phrase "lead intake".
 */

export interface ParsedAdvancedSearchQuery {
  phrases: string[];
  tokens: string[];
}

/** True when the query is empty or only whitespace after parsing. */
export function isParsedQueryEmpty(q: ParsedAdvancedSearchQuery): boolean {
  return q.phrases.length === 0 && q.tokens.length === 0;
}

/**
 * Parse user input into lowercase phrases (quoted) and tokens (unquoted words).
 * Supports backslash-escaped quotes inside "...".
 */
export function parseAdvancedSearchQuery(raw: string): ParsedAdvancedSearchQuery {
  const phrases: string[] = [];
  const tokens: string[] = [];
  const s = raw.trim();
  if (!s) return { phrases, tokens };

  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) {
      i++;
      continue;
    }
    if (s[i] === '"') {
      i++;
      let buf = "";
      while (i < s.length) {
        if (s[i] === "\\" && i + 1 < s.length) {
          buf += s[i + 1];
          i += 2;
          continue;
        }
        if (s[i] === '"') {
          i++;
          break;
        }
        buf += s[i];
        i++;
      }
      const p = buf.trim().replace(/\s+/g, " ").toLowerCase();
      if (p) phrases.push(p);
      continue;
    }
    const start = i;
    while (i < s.length && !/\s/.test(s[i]) && s[i] !== '"') i++;
    const t = s.slice(start, i).trim().toLowerCase();
    if (t) tokens.push(t);
  }
  return { phrases, tokens };
}

/** Every phrase and token must appear as a substring in haystack (already lowercased). */
export function haystackMatchesParsedQuery(haystackLower: string, q: ParsedAdvancedSearchQuery): boolean {
  if (isParsedQueryEmpty(q)) return true;
  for (const p of q.phrases) {
    if (!haystackLower.includes(p)) return false;
  }
  for (const t of q.tokens) {
    if (!haystackLower.includes(t)) return false;
  }
  return true;
}

/**
 * Strip common conversational prefixes so assistant / directory search matches the topic.
 */
export function stripConversationalSearchNoise(message: string): string {
  let m = message.trim();
  if (!m) return m;
  m = m.replace(/\?+$/g, "").trim();

  const patterns: RegExp[] = [
    /^(where\s+(do\s+i|can\s+i)\s+)?(find|go|get)\s+/i,
    /^(where\s+is|where\s+are|where\s+do\s+i\s+find)\s+(the\s+)?/i,
    /^(open|navigate\s+to|go\s+to|take\s+me\s+to|show\s+me)\s+(the\s+)?/i,
    /^(i\s+need\s+to\s+)?(find|search\s+for|look\s+for)\s+(the\s+)?/i,
    /^(please\s+)?(help\s+(me\s+)?)?(find|open|show)\s+/i,
    /^(can\s+you\s+)?(open|show|take\s+me)\s+/i,
  ];

  let prev = "";
  while (prev !== m) {
    prev = m;
    for (const re of patterns) {
      m = m.replace(re, "").trim();
    }
  }
  return m.trim();
}
