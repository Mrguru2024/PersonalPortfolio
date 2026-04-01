import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { MIN_CRON_SECRET_LENGTH } from "@shared/production-security-env";

function cronBearerMatches(authHeader: string | null, secret: string): boolean {
  const prefix = "Bearer ";
  if (!authHeader || !authHeader.startsWith(prefix)) return false;
  const token = authHeader.slice(prefix.length).trim();
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/cron/brand-vault
 * Removes expired brand temp files from disk and database (90-day retention).
 */
export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret || secret.length < MIN_CRON_SECRET_LENGTH) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
    }
    if (!cronBearerMatches(req.headers.get("authorization"), secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const out = await storage.purgeExpiredBrandTempFiles();
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    console.error("[cron/brand-vault]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
