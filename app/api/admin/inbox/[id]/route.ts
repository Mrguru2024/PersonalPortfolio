import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { getAdminInboxItemById, markAdminInboxRead } from "@server/services/adminInboxService";

export const dynamic = "force-dynamic";

/** GET /api/admin/inbox/[id] — single item; marks read for current admin. */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null || !Number.isFinite(userId)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: raw } = await ctx.params;
    const itemId = Number(raw);
    if (!Number.isFinite(itemId) || itemId < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const item = await getAdminInboxItemById(itemId);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await markAdminInboxRead(userId, itemId);
    return NextResponse.json({ item });
  } catch (e) {
    console.error("GET /api/admin/inbox/[id]:", e);
    return NextResponse.json({ error: "Failed to load item" }, { status: 500 });
  }
}
