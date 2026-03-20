import { NextRequest, NextResponse } from "next/server";
import { runScheduledGrowthOsJobs } from "@server/services/growthIntelligence/automationService";

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
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
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
