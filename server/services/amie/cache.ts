import type { AmieFullAnalysis, AmieMarketInput } from "./types";

type CacheEntry = { at: number; value: AmieFullAnalysis };

const STORE = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 48;

export function amieCacheKey(input: AmieMarketInput): string {
  return [
    input.projectKey ?? "ascendra_main",
    input.industry.trim(),
    input.serviceType.trim(),
    input.location.trim(),
    input.persona.trim(),
  ]
    .join("\x1e")
    .toLowerCase();
}

export function getCachedAmie(key: string): AmieFullAnalysis | null {
  const row = STORE.get(key);
  if (!row) return null;
  if (Date.now() - row.at > TTL_MS) {
    STORE.delete(key);
    return null;
  }
  return row.value;
}

export function setCachedAmie(key: string, value: AmieFullAnalysis): void {
  if (STORE.size >= MAX_ENTRIES) {
    const first = STORE.keys().next().value;
    if (first) STORE.delete(first);
  }
  STORE.set(key, { at: Date.now(), value });
}
