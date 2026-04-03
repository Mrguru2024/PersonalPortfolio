import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { sendCrmLeadEmail } from "@server/services/ionosMail/sendCrmIonosEmail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().max(50_000),
  sendAs: z.string().min(1).max(80),
});

/**
 * POST /api/admin/crm/contacts/[id]/send-email
 * IONOS SMTP to lead with Send As + owner-based Reply-To.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const session = await getSessionUser(req);
    const sessionUserId = session?.id != null ? Number(session.id) : null;

    const id = Number((await params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    const contact = await storage.getCrmContactById(id);
    if (!contact) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await sendCrmLeadEmail({
      contact,
      subject: parsed.data.subject,
      bodyText: parsed.data.body,
      sendAsKey: parsed.data.sendAs,
      sessionUserId: Number.isFinite(sessionUserId) ? sessionUserId : null,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      messageId: result.messageId,
      from: result.usedFrom,
      replyTo: result.replyTo,
    });
  } catch (e) {
    console.error("POST /api/admin/crm/contacts/[id]/send-email:", e);
    return NextResponse.json({ ok: false, error: "Send failed" }, { status: 500 });
  }
}
