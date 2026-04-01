import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { offerEngineSummary, ensureAnalyticsMetricSeeds } from "@server/services/offerEngineService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/offer-engine/summary */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    await ensureAnalyticsMetricSeeds();
    const summary = await offerEngineSummary();
    return NextResponse.json(summary);
  } catch (e) {
    console.error("[GET offer-engine/summary]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
