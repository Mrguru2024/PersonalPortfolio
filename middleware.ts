import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

/** Per-IP sliding window for /api/admin/* when Upstash is configured (slows brute force / session abuse). */
const ADMIN_MAX_PER_MINUTE = 400;

type GlobalWithRl = typeof globalThis & { __ppAdminRatelimit?: Ratelimit };

function getAdminRatelimit(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  const g = globalThis as GlobalWithRl;
  if (g.__ppAdminRatelimit) return g.__ppAdminRatelimit;

  const redis = Redis.fromEnv({
    UPSTASH_REDIS_REST_URL: url,
    UPSTASH_REDIS_REST_TOKEN: token,
  });
  g.__ppAdminRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(ADMIN_MAX_PER_MINUTE, "1 m"),
    prefix: "pp:admin-api",
    analytics: false,
  });
  return g.__ppAdminRatelimit;
}

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  return "unknown";
}

export async function middleware(req: NextRequest) {
  const limiter = getAdminRatelimit();
  if (!limiter) return NextResponse.next();

  const ip = clientIp(req);
  const { success, pending } = await limiter.limit(`admin:${ip}`);
  if (pending) await pending;

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests", message: "Admin API rate limit exceeded" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/admin/:path*",
};
