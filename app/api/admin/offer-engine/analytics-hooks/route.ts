import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { ensureAnalyticsMetricSeeds, listAnalyticsMetricDefinitions } from "@server/services/offerEngineService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/offer-engine/analytics-hooks — placeholder metric definitions only (no fake dashboards) */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    await ensureAnalyticsMetricSeeds();
    const definitions = await listAnalyticsMetricDefinitions();
    return NextResponse.json({
      definitions: definitions.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
      })),
      note: "Event time-series not stored here; wire these keys when instrumentation exists.",
    });
  } catch (e) {
    console.error("[GET offer-engine/analytics-hooks]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
