import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { createAfnMessage } from "@server/afnStorage";
import { db } from "@server/db";
import { afnMessageThreadParticipants } from "@shared/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** POST /api/community/messages/threads/[id]/messages — send message (participant only). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
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
    const body = await req.json().catch(() => ({}));
    const bodyText = String(body.body ?? "").trim();
    if (!bodyText) {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }
    const message = await createAfnMessage({
      threadId,
      senderId: Number(user.id),
      body: bodyText,
    });
    return NextResponse.json(message);
  } catch (e) {
    console.error("POST community message error:", e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
