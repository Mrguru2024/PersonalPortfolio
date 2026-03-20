/**
 * Rate limiting for unauthenticated public API routes.
 * - In-memory sliding window (per instance) via {@link checkPublicApiRateLimit}.
 * - When `UPSTASH_REDIS_REST_*` is set, {@link checkPublicApiRateLimitAsync} uses Upstash (global).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const PRUNE_EVERY = 500;

function prune(now: number) {
  if (buckets.size < PRUNE_EVERY) return;
  for (const [k, v] of buckets) {
    if (now > v.resetAt) buckets.delete(k);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param key e.g. IP or token hash prefix
 * @param limit max requests per window
 * @param windowMs window length in ms
 */
/**
 * Prefer Upstash when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set (global limit across instances).
 * Otherwise uses in-memory {@link checkPublicApiRateLimit}.
 */
export async function checkPublicApiRateLimitAsync(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  try {
    const { tryUpstashRateLimit } = await import("./upstash-rate-limit");
    const upstash = await tryUpstashRateLimit(key, limit, windowMs);
    if (upstash !== null) return upstash;
  } catch (e) {
    console.error("[checkPublicApiRateLimitAsync] Upstash unavailable, using memory", e);
  }
  return checkPublicApiRateLimit(key, limit, windowMs);
}

export function checkPublicApiRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  prune(now);
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, resetAt: b.resetAt };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, resetAt: b.resetAt };
}

export function getClientIp(req: { headers: Headers }): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
