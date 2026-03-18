import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { afnNotifications } from "@shared/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/community/notifications — list current user's notifications. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "30", 10) || 30, 50);
    const list = await db
      .select()
      .from(afnNotifications)
      .where(eq(afnNotifications.userId, Number(user.id)))
      .orderBy(desc(afnNotifications.createdAt))
      .limit(limit);
    return NextResponse.json(list);
  } catch (e) {
    console.error("GET community notifications error:", e);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

/** PATCH /api/community/notifications — mark as read. Body: id (optional, or ids array) or markAll. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const userId = Number(user.id);
    if (body.markAll) {
      await db
        .update(afnNotifications)
        .set({ isRead: true })
        .where(eq(afnNotifications.userId, userId));
      return NextResponse.json({ ok: true });
    }
    const id = body.id != null ? Number(body.id) : null;
    const ids = Array.isArray(body.ids) ? body.ids.map(Number) : id != null ? [id] : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "id, ids, or markAll required" }, { status: 400 });
    }
    await db
      .update(afnNotifications)
      .set({ isRead: true })
      .where(and(eq(afnNotifications.userId, userId), inArray(afnNotifications.id, ids)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH community notifications error:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
