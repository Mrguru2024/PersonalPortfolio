import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { sendIonosTestEmail } from "@server/services/ionosMail/ionosSmtpService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/admin/system-email/test-send
 * Body optional: { "to": "you@example.com" } — defaults to IONOS_EMAIL.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    let to: string | undefined;
    try {
      const body = (await req.json().catch(() => ({}))) as { to?: string };
      to = typeof body.to === "string" ? body.to.trim() : undefined;
    } catch {
      to = undefined;
    }

    const result = await sendIonosTestEmail(to);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, messageId: result.messageId, to: result.to });
  } catch (e) {
    console.error("POST /api/admin/system-email/test-send:", e);
    return NextResponse.json({ ok: false, error: "Test send failed" }, { status: 500 });
  }
}
