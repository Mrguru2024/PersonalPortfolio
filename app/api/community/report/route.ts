import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { createAfnModerationReport } from "@server/afnStorage";

export const dynamic = "force-dynamic";

const ALLOWED_TARGET_TYPES = ["post", "comment", "collab_post", "profile"] as const;
const ALLOWED_REASONS = ["spam", "harassment", "inappropriate", "other"] as const;

/** POST /api/community/report — submit a moderation report. */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const targetType = body.targetType;
    const targetId = body.targetId != null ? Number(body.targetId) : null;
    const reason = body.reason;
    const details = body.details ? String(body.details).trim().slice(0, 2000) : null;
    if (!ALLOWED_TARGET_TYPES.includes(targetType) || targetId == null || Number.isNaN(targetId)) {
      return NextResponse.json(
        { error: "targetType (post|comment|collab_post|profile) and targetId required" },
        { status: 400 }
      );
    }
    if (!reason || !ALLOWED_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: "reason required: spam, harassment, inappropriate, or other" },
        { status: 400 }
      );
    }
    await createAfnModerationReport({
      reporterId: Number(user.id),
      targetType,
      targetId,
      reason,
      details,
      status: "pending",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST community report error:", e);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
