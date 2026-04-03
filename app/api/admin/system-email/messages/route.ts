import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { enrichSystemEmailMessagesWithCrm } from "@server/services/ionosMail/crmEmailMatch";
import { fetchRecentIonosInboxMessages } from "@server/services/ionosMail/ionosImapService";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * GET /api/admin/system-email/messages?limit=30
 * Admin only. Fetches recent IMAP messages and CRM matches by sender.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? "30");

    const fetched = await fetchRecentIonosInboxMessages({ limit });
    if (!fetched.ok) {
      return NextResponse.json(
        { ok: false, error: fetched.error, messages: [] },
        { status: 503 },
      );
    }

    const messages = await enrichSystemEmailMessagesWithCrm(fetched.messages);
    return NextResponse.json({ ok: true, messages });
  } catch (e) {
    console.error("GET /api/admin/system-email/messages:", e);
    return NextResponse.json({ ok: false, error: "Failed to load messages", messages: [] }, { status: 500 });
  }
}
