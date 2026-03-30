import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listBehaviorSessionsWithReplayForAdmin } from "@server/services/behavior/behaviorIngestService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 50));
  const sessions = await listBehaviorSessionsWithReplayForAdmin(limit);
  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id,
      sessionId: s.sessionId,
      startTime: s.startTime,
      endTime: s.endTime,
      device: s.device,
      converted: s.converted,
      replaySegmentsCount: s.replaySegmentCount,
      eventCount: s.replayEventCount,
      lastReplayAt: s.lastReplayAt,
    })),
  );
}
