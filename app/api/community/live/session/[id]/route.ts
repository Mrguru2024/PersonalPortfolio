import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { getAfnLiveSessionById } from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** GET /api/community/live/session/[id] — host retrieves join hints for a session they own. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sid = Number((await ctx.params).id);
    if (!Number.isFinite(sid)) {
      return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
    }
    const session = await getAfnLiveSessionById(sid);
    if (!session || session.hostUserId !== Number(user.id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: session.id,
      provider: session.provider,
      status: session.status,
      sessionKind: session.sessionKind,
      title: session.title,
      roomName: session.roomName,
      joinUrl: session.joinUrl,
      livekit:
        session.provider === "livekit" && session.livekitWsUrl && session.livekitToken
          ? { url: session.livekitWsUrl, token: session.livekitToken, roomName: session.roomName }
          : null,
      createdAt: session.createdAt?.toISOString?.() ?? null,
    });
  } catch (e) {
    console.error("GET live session error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
