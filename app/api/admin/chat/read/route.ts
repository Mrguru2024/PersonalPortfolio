import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { adminChatReadCursor } from "@shared/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** POST /api/admin/chat/read - mark messages as read up to lastReadMessageId */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json(
        { message: "Session required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const lastReadMessageId =
      typeof body?.lastReadMessageId === "number"
        ? body.lastReadMessageId
        : parseInt(String(body?.lastReadMessageId ?? "0"), 10);

    if (!Number.isInteger(lastReadMessageId) || lastReadMessageId < 0) {
      return NextResponse.json(
        { message: "Valid lastReadMessageId required" },
        { status: 400 }
      );
    }

    await db
      .insert(adminChatReadCursor)
      .values({
        userId: user.id,
        lastReadMessageId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: adminChatReadCursor.userId,
        set: {
          lastReadMessageId,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Error marking admin chat read:", error);
    return NextResponse.json(
      { error: "Failed to mark read" },
      { status: 500 }
    );
  }
}
