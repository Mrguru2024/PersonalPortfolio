import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/** Matches {@link RateLimitResult} in `public-api-rate-limit.ts` (kept separate to avoid circular imports). */
export interface UpstashRateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

const limiterCache = new Map<string, Ratelimit>();

/**
 * True when Upstash Redis REST credentials are set. Create a database at https://console.upstash.com
 */
export function isUpstashRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
}

function getLimiter(max: number, windowMs: number): Ratelimit | null {
  if (!isUpstashRedisConfigured()) return null;
  const sec = Math.max(1, Math.ceil(windowMs / 1000));
  const cacheKey = `${max}:${sec}`;
  let rl = limiterCache.get(cacheKey);
  if (!rl) {
    const redis = Redis.fromEnv();
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${sec} s`),
      prefix: `@upstash/ratelimit/pp/${max}/${sec}`,
      analytics: false,
    });
    limiterCache.set(cacheKey, rl);
  }
  return rl;
}

/**
 * Distributed sliding-window limit using Upstash. Returns `null` if not configured or on error (caller should fall back).
 */
export async function tryUpstashRateLimit(
  identifier: string,
  max: number,
  windowMs: number,
): Promise<UpstashRateLimitResult | null> {
  const limiter = getLimiter(max, windowMs);
  if (!limiter) return null;
  try {
    const r = await limiter.limit(identifier);
    return {
      ok: r.success,
      remaining: r.remaining,
      resetAt: r.reset,
    };
  } catch (e) {
    console.error("[tryUpstashRateLimit]", e);
    return null;
  }
}
