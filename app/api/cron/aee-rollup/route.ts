import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { runAeeDailyRollup } from "@server/services/experimentation/aeeRollupService";
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
 * GET /api/cron/aee-rollup?workspaceKey=ascendra_main&days=7
 * Recomputes AEE daily metrics for the last `days` (default 7), UTC.
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
    const { searchParams } = req.nextUrl;
    const workspaceKey = searchParams.get("workspaceKey") ?? "ascendra_main";
    const days = Math.min(90, Math.max(1, Number.parseInt(searchParams.get("days") ?? "7", 10) || 7));
    const to = new Date();
    const from = new Date(to.getTime() - days * 86_400_000);
    const result = await runAeeDailyRollup({ workspaceKey, from, to });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("aee-rollup cron", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
