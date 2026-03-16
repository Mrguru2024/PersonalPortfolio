import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { adminChatMessages, adminChatReadCursor, users } from "@shared/schema";
import { desc, eq, and, gt, ne, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const RECENT_LIMIT = 5;

/** GET /api/admin/chat/notifications - unread count and recent messages for bell dropdown */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({
        unreadCount: 0,
        recentMessages: [],
      });
    }

    const [cursor] = await db
      .select()
      .from(adminChatReadCursor)
      .where(eq(adminChatReadCursor.userId, user.id))
      .limit(1);

    const lastReadId = cursor?.lastReadMessageId ?? 0;

    const unreadCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminChatMessages)
      .where(
        and(
          gt(adminChatMessages.id, lastReadId),
          ne(adminChatMessages.senderId, user.id)
        )
      );

    const unreadCount = unreadCountResult[0]?.count ?? 0;

    const recentRows = await db
      .select({
        id: adminChatMessages.id,
        senderId: adminChatMessages.senderId,
        content: adminChatMessages.content,
        createdAt: adminChatMessages.createdAt,
        senderUsername: users.username,
      })
      .from(adminChatMessages)
      .innerJoin(users, eq(adminChatMessages.senderId, users.id))
      .orderBy(desc(adminChatMessages.id))
      .limit(RECENT_LIMIT);

    return NextResponse.json({
      unreadCount,
      recentMessages: recentRows.map((r) => ({
        id: r.id,
        senderId: r.senderId,
        senderUsername: r.senderUsername,
        content: r.content,
        createdAt: r.createdAt,
        isUnread: r.id > lastReadId && r.senderId !== user.id,
      })),
    });
  } catch (error: unknown) {
    console.error("Error fetching admin chat notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
