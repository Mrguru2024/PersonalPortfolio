import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/reminders/[id] — update status: dismissed | done | snoozed (body: { status, snoozedUntil? }). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { id } = await params;
    const reminderId = parseInt(id, 10);
    if (Number.isNaN(reminderId)) {
      return NextResponse.json({ error: "Invalid reminder id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const status = body?.status as string | undefined;
    const allowed = ["dismissed", "done", "snoozed"];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json(
        { error: "status must be one of: dismissed, done, snoozed" },
        { status: 400 }
      );
    }

    const updates: { status: string; snoozedUntil?: Date | null } = { status };
    if (status === "snoozed" && body?.snoozedUntil) {
      const until = new Date(body.snoozedUntil);
      if (Number.isNaN(until.getTime())) {
        return NextResponse.json({ error: "Invalid snoozedUntil" }, { status: 400 });
      }
      updates.snoozedUntil = until;
    } else if (status !== "snoozed") {
      updates.snoozedUntil = null;
    }

    const updated = await storage.updateAdminReminder(reminderId, updates);
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH admin reminder error:", e);
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
  }
}
