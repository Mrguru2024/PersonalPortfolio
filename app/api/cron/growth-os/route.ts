import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { runScheduledGrowthOsJobs } from "@server/services/growthIntelligence/automationService";
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
 * GET /api/cron/growth-os?projectKey=ascendra_main
 * Vercel Cron: set CRON_SECRET in project env; Vercel sends Authorization: Bearer <CRON_SECRET>.
 * For manual testing: same header locally.
 */
export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) {
      return NextResponse.json(
        { error: "CRON_SECRET is not configured", hint: "Add CRON_SECRET to environment for scheduled jobs." },
        { status: 503 },
      );
    }
    if (secret.length < MIN_CRON_SECRET_LENGTH) {
      return NextResponse.json(
        {
          error: "CRON_SECRET too short",
          hint: `Use at least ${MIN_CRON_SECRET_LENGTH} characters (e.g. openssl rand -hex 24).`,
        },
        { status: 503 },
      );
    }
    const auth = req.headers.get("authorization");
    if (!cronBearerMatches(auth, secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectKey = req.nextUrl.searchParams.get("projectKey") ?? "ascendra_main";
    const out = await runScheduledGrowthOsJobs({
      projectKey,
      triggeredByUserId: null,
    });
    return NextResponse.json({ ok: true, projectKey, ...out });
  } catch (e: unknown) {
    console.error("[cron/growth-os]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
