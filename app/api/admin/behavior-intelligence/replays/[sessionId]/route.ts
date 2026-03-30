import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getReplayEventsForSession } from "@server/services/behavior/behaviorIngestService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ sessionId: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { sessionId } = await ctx.params;
  const sid = decodeURIComponent(sessionId || "").slice(0, 128);
  if (!sid) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const events = await getReplayEventsForSession(sid);
  return NextResponse.json({ sessionId: sid, events });
}
