import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { getAfnThreadMessages } from "@server/afnStorage";
import { db } from "@server/db";
import { afnMessageThreadParticipants, afnMessageThreads, afnProfiles } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/community/messages/threads/[id] — get messages in thread (participant only). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(_req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const threadId = parseInt(id, 10);
    if (Number.isNaN(threadId)) {
      return NextResponse.json({ error: "Invalid thread id" }, { status: 400 });
    }
    const participants = await db
      .select()
      .from(afnMessageThreadParticipants)
      .where(eq(afnMessageThreadParticipants.threadId, threadId));
    const isParticipant = participants.some((p) => p.userId === Number(user.id));
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const messages = await getAfnThreadMessages(threadId);
    const authorIds = [...new Set(messages.map((m) => m.senderId))];
    const profiles =
      authorIds.length > 0
        ? await db.select().from(afnProfiles).where(inArray(afnProfiles.userId, authorIds))
        : [];
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));
    const messagesWithAuthors = messages.map((m) => ({
      ...m,
      senderProfile: profileByUserId.get(m.senderId) ?? null,
    }));
    return NextResponse.json(messagesWithAuthors);
  } catch (e) {
    console.error("GET community thread messages error:", e);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}
