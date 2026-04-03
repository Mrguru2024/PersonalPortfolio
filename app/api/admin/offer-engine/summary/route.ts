import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  offerEngineSummary,
  ensureAnalyticsMetricSeeds,
  buildOfferEngineIntelligence,
} from "@server/services/offerEngineService";
import { listScarcityConfigs } from "@modules/scarcity-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/offer-engine/summary */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    await ensureAnalyticsMetricSeeds();
    const [summary, intelligence] = await Promise.all([
      offerEngineSummary(),
      buildOfferEngineIntelligence(),
    ]);
    const scarcityConfigs = await listScarcityConfigs();
    return NextResponse.json({
      ...summary,
      intelligence,
      scarcity: {
        configCount: scarcityConfigs.length,
        activeConfigCount: scarcityConfigs.filter((cfg) => cfg.isActive).length,
      },
    });
  } catch (e) {
    console.error("[GET offer-engine/summary]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
