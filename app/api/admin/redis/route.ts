import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { isSuperUser } from "@/lib/auth-helpers";
import { isUpstashRedisConfigured } from "@/lib/upstash-rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_KEY_LEN = 512;

function isValidRedisKey(key: string): boolean {
  if (key.length === 0 || key.length > MAX_KEY_LEN) return false;
  // Block control characters; Upstash keys are otherwise opaque strings.
  return !/[\0-\x1f\x7f]/.test(key);
}

/**
 * GET /api/admin/redis?key=...
 * Super user only. Reads a single key from Upstash Redis (same DB as rate limiting).
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { error: "Forbidden", message: "Super user access required" },
        { status: 403 },
      );
    }

    if (!isUpstashRedisConfigured()) {
      return NextResponse.json(
        { error: "Service unavailable", message: "Upstash Redis is not configured" },
        { status: 503 },
      );
    }

    const key = req.nextUrl.searchParams.get("key")?.trim() ?? "";
    if (!isValidRedisKey(key)) {
      return NextResponse.json(
        {
          error: "Bad request",
          message: `Missing or invalid key. Provide ?key=... (1–${MAX_KEY_LEN} chars, no control characters).`,
        },
        { status: 400 },
      );
    }

    const redis = Redis.fromEnv();
    const result = await redis.get(key);
    return NextResponse.json({ key, result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[GET /api/admin/redis]", msg);
    return NextResponse.json(
      { error: "Server error", message: "Failed to read from Redis" },
      { status: 500 },
    );
  }
}
