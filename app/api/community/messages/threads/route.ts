import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getOrCreateDirectThread,
  getAfnUserThreads,
  getAfnProfileSettings,
} from "@server/afnStorage";
import { canMessageTarget } from "@server/afnStorage";
import { db } from "@server/db";
import { afnMessageThreadParticipants, afnProfiles } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/community/messages/threads — list current user's threads. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const threads = await getAfnUserThreads(userId);
    const otherUserIds = new Set<number>();
    for (const t of threads) {
      const participants = await db
        .select()
        .from(afnMessageThreadParticipants)
        .where(eq(afnMessageThreadParticipants.threadId, t.id));
      for (const p of participants) {
        if (p.userId !== userId) otherUserIds.add(p.userId);
      }
    }
    const profiles =
      otherUserIds.size > 0
        ? await db.select().from(afnProfiles).where(inArray(afnProfiles.userId, [...otherUserIds]))
        : [];
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));
    const threadsWithOthers = await Promise.all(
      threads.map(async (t) => {
        const participants = await db
          .select()
          .from(afnMessageThreadParticipants)
          .where(eq(afnMessageThreadParticipants.threadId, t.id));
        const other = participants.find((p) => p.userId !== userId);
        return {
          ...t,
          otherUserId: other?.userId ?? null,
          otherProfile: other ? profileByUserId.get(other.userId) ?? null : null,
        };
      })
    );
    return NextResponse.json(threadsWithOthers);
  } catch (e) {
    console.error("GET community threads error:", e);
    return NextResponse.json({ error: "Failed to load threads" }, { status: 500 });
  }
}

/** POST /api/community/messages/threads — create or get thread with another user. Body: otherUserId. */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const otherUserId = body.otherUserId != null ? Number(body.otherUserId) : null;
    if (otherUserId == null || Number.isNaN(otherUserId) || otherUserId === Number(user.id)) {
      return NextResponse.json({ error: "Valid otherUserId required" }, { status: 400 });
    }
    const targetSettings = await getAfnProfileSettings(otherUserId);
    const safeTargetSettings = {
      messagePermission: targetSettings?.messagePermission ?? "none",
      openToCollaborate: targetSettings?.openToCollaborate ?? false,
    };
    if (!canMessageTarget(safeTargetSettings)) {
      return NextResponse.json(
        { error: "This member does not accept messages or only accepts from collaborators." },
        { status: 403 }
      );
    }
    const thread = await getOrCreateDirectThread(Number(user.id), otherUserId);
    return NextResponse.json(thread);
  } catch (e) {
    console.error("POST community threads error:", e);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
