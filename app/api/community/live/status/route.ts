import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { getAfnLiveProviderAvailability, pickTimelineLiveProvider } from "@server/services/afnLiveRouterService";
import { getEffectiveTimelineLiveAccess, canHostTimelineLiveAccess } from "@server/services/afnTimelineLiveAccessService";

export const dynamic = "force-dynamic";

/** GET /api/community/live/status — provider readiness (Phase 9) + effective Timeline Live tier (Phase 10). */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const providers = getAfnLiveProviderAvailability();
    const primary = pickTimelineLiveProvider();
    const timelineLive = await getEffectiveTimelineLiveAccess(userId);
    return NextResponse.json({
      providers,
      primary,
      timelineLive,
      canHostTimelineLive: canHostTimelineLiveAccess(timelineLive.level),
    });
  } catch (e) {
    console.error("GET live status error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
