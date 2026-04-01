import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { deleteTimelineLiveOverride, upsertTimelineLiveOverride } from "@server/afnStorage";
import { applyComputedTimelineLiveAccess } from "@server/services/afnTimelineLiveAccessService";
import { db } from "@server/db";
import { afnProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isTimelineLiveAccessLevel } from "@/lib/community/constants";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/community/live-access
 * Body: { userId: number, accessLevel: string | null, reason?: string, expiresAt?: string | null }
 * — `accessLevel` null clears override and recomputes stored tier.
 */
export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const admin = await getSessionUser(req);
    if (!admin?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const userId = body.userId != null ? Number(body.userId) : NaN;
    if (!Number.isFinite(userId) || userId < 1) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const accessLevelRaw = body.accessLevel;
    const reason =
      body.reason != null && typeof body.reason === "string" ? body.reason.trim().slice(0, 2000) : null;
    let expiresAt: Date | null = null;
    if (body.expiresAt != null) {
      const s = String(body.expiresAt).trim();
      if (s === "") expiresAt = null;
      else {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json({ error: "Invalid expiresAt" }, { status: 400 });
        }
        expiresAt = d;
      }
    }

    if (accessLevelRaw === null || accessLevelRaw === "") {
      await deleteTimelineLiveOverride(userId);
      await applyComputedTimelineLiveAccess(userId);
      return NextResponse.json({ ok: true, cleared: true, userId });
    }

    if (typeof accessLevelRaw !== "string" || !isTimelineLiveAccessLevel(accessLevelRaw)) {
      return NextResponse.json(
        { error: "accessLevel must be viewer | active | trusted | featured, or null to clear" },
        { status: 400 }
      );
    }

    await upsertTimelineLiveOverride({
      userId,
      accessLevel: accessLevelRaw,
      reason,
      setByAdminUserId: Number(admin.id),
      expiresAt,
    });

    await db
      .update(afnProfiles)
      .set({ timelineLiveAccessLevel: accessLevelRaw, updatedAt: new Date() })
      .where(eq(afnProfiles.userId, userId));

    return NextResponse.json({ ok: true, userId, accessLevel: accessLevelRaw, expiresAt: expiresAt?.toISOString() ?? null });
  } catch (e) {
    console.error("PATCH admin live-access error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
