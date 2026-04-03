import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { markAdminInboxRead } from "@server/services/adminInboxService";

export const dynamic = "force-dynamic";

/** POST /api/admin/inbox/[id]/read — mark one item read. */
export async function POST(
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

    await markAdminInboxRead(userId, itemId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/admin/inbox/[id]/read:", e);
    return NextResponse.json({ error: "Failed to update read state" }, { status: 500 });
  }
}
