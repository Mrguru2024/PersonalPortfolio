import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { applyLeadControlAction } from "@server/services/leadControl/applyLeadControlAction";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  action: z.enum([
    "call_attempt",
    "voicemail",
    "email_sent",
    "sms_sent",
    "meeting_started",
    "copy_contact",
    "log_touch",
  ]),
  note: z.string().max(2000).optional().nullable(),
});

/** POST /api/admin/lead-control/contacts/[id]/actions — log communication touch + update priority / first response */
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

    const result = await applyLeadControlAction(storage, id, {
      ...parsed.data,
      createdByUserId,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 });

    const contact = await storage.getCrmContactById(id);
    return NextResponse.json({ ok: true, contact });
  } catch (e) {
    console.error("[POST /api/admin/lead-control/contacts/[id]/actions]", e);
    return NextResponse.json({ error: "Failed to apply action" }, { status: 500 });
  }
}
