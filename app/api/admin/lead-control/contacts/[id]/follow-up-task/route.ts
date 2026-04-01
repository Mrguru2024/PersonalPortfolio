import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { createLeadControlQuickFollowUpTask } from "@server/services/leadControl/createLeadControlQuickFollowUpTask";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  preset: z.enum(["tomorrow", "two_days", "one_week"]),
  note: z.string().max(2000).optional().nullable(),
});

/** POST /api/admin/lead-control/contacts/[id]/follow-up-task — quick CRM task + timeline entry. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const sessionUser = await getSessionUser(req);
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    const uid = sessionUser?.id != null ? Number(sessionUser.id) : null;
    const createdByUserId = Number.isFinite(uid) ? uid : null;

    const result = await createLeadControlQuickFollowUpTask(storage, id, parsed.data.preset, {
      note: parsed.data.note,
      createdByUserId,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 });

    return NextResponse.json({ ok: true, taskId: result.taskId });
  } catch (e) {
    console.error("[POST /api/admin/lead-control/contacts/[id]/follow-up-task]", e);
    return NextResponse.json({ error: "Failed to create follow-up task" }, { status: 500 });
  }
}
