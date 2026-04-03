import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { markAllAdminInboxRead } from "@server/services/adminInboxService";

export const dynamic = "force-dynamic";

/** POST /api/admin/inbox/read-all — mark all inbox items read for current admin. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null || !Number.isFinite(userId)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await markAllAdminInboxRead(userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/admin/inbox/read-all:", e);
    return NextResponse.json({ error: "Failed to update read state" }, { status: 500 });
  }
}
