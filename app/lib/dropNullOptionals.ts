/**
 * Zod `.optional().nullable()` infers `T | null | undefined`. Some insert/service types only allow
 * `T | undefined`. Strip `null` for chosen keys so spreads satisfy strict TS (e.g. before `createCaseStudy`).
 */
export function dropNullOptionals<T extends Record<string, unknown>>(
  obj: T,
  keys: readonly (keyof T & string)[],
): T {
  const next = { ...obj };
  for (const k of keys) {
    if (next[k] === null) {
      delete (next as Record<string, unknown>)[k];
    }
  }
  return next;
}
