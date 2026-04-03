import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  getAdminInboxUnreadCount,
  listAdminInboxForUser,
} from "@server/services/adminInboxService";

export const dynamic = "force-dynamic";

/** GET /api/admin/inbox — list inbox items for current admin (newest first). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null || !Number.isFinite(userId)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? "50");
    const offset = Number(searchParams.get("offset") ?? "0");
    const countOnly = searchParams.get("countOnly") === "1";

    if (countOnly) {
      const unread = await getAdminInboxUnreadCount(userId);
      return NextResponse.json({ unreadCount: unread });
    }

    const items = await listAdminInboxForUser(userId, { limit, offset });
    const unreadCount = await getAdminInboxUnreadCount(userId);

    return NextResponse.json({ items, unreadCount });
  } catch (e) {
    console.error("GET /api/admin/inbox:", e);
    return NextResponse.json({ error: "Failed to load inbox" }, { status: 500 });
  }
}
