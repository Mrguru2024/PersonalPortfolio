import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { createTimelineLiveRoom } from "@server/services/afnLiveRouterService";
import { getEffectiveTimelineLiveAccess, canHostTimelineLiveAccess } from "@server/services/afnTimelineLiveAccessService";

export const dynamic = "force-dynamic";

/** POST /api/community/live/timeline-room — host provisions a room (Phase 9); requires active+ access tier. */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const effective = await getEffectiveTimelineLiveAccess(userId);
    if (!canHostTimelineLiveAccess(effective.level)) {
      return NextResponse.json(
        { error: "Timeline Live hosting requires active access or higher", timelineLive: effective },
        { status: 403 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const title =
      typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 200) : "Timeline Live";
    const result = await createTimelineLiveRoom({ title, userId });
    if (result.error && !result.sessionId) {
      return NextResponse.json({ ...result, timelineLive: effective }, { status: 503 });
    }
    return NextResponse.json({ ...result, timelineLive: effective });
  } catch (e) {
    console.error("POST timeline-room error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
