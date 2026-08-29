import { NextRequest, NextResponse } from "next/server";
import { getApprovedAdminSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import {
  mergeObservationIntoMentorState,
  maybeEnqueueCheckpointNudge,
  validateObservationPayload,
} from "@server/services/adminAgentObservationService";
import { emptyMentorState, parseStoredMentorState } from "@server/services/adminAgentMentorService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/agent/observation — batch coarse admin path visits for the mentor (opt-in).
 * Only runs when `aiMentorObserveUsage` is true for the session user. No PII payloads.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getApprovedAdminSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const settings = await storage.getAdminSettings(userId);
    if (!settings?.aiMentorObserveUsage) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const json = await req.json().catch(() => ({}));
    const events = validateObservationPayload(json);
    if (!events?.length) {
      return NextResponse.json({ ok: true, merged: 0 });
    }

    const row = await storage.getAdminAgentMentorState(userId);
    const parsed = row?.state ? parseStoredMentorState(row.state) : null;
    let state = parsed ?? emptyMentorState();
    state = mergeObservationIntoMentorState(state, events);

    const checkpoint = maybeEnqueueCheckpointNudge({
      state,
      proactiveCheckpoints: settings.aiMentorProactiveCheckpoints !== false,
      observeUsage: true,
    });
    const finalState = checkpoint.didUpdate ? checkpoint.state : state;

    await storage.upsertAdminAgentMentorState(userId, finalState);

    return NextResponse.json({
      ok: true,
      merged: events.length,
      checkpointAdded: checkpoint.didUpdate,
      mentorNudge: finalState.pendingMentorNudges?.[0] ?? null,
    });
  } catch (e) {
    console.error("[POST /api/admin/agent/observation]", e);
    return NextResponse.json({ error: "Observation merge failed" }, { status: 500 });
  }
}
