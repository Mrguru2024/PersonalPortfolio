import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  defaultSendAsKeyForSession,
  formatSenderOptionLabel,
  listAuthorizedSenderRows,
} from "@server/services/ionosMail/sendCrmIonosEmail";
import { getPrimarySenderConfig } from "@server/services/ionosMail/outboundEnv";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/email/authorized-senders
 * Options for CRM “Send as” + default key (non-secret).
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const session = await getSessionUser(req);
    const sessionUserId = session?.id != null ? Number(session.id) : null;

    const primary = getPrimarySenderConfig();
    const authorized = await listAuthorizedSenderRows();

    const options = authorized.map((row) => ({
      key: `user:${row.id}` as const,
      label: formatSenderOptionLabel(row),
      email: row.senderEmail!.trim().toLowerCase(),
      userId: row.id,
    }));

    const defaultKey = defaultSendAsKeyForSession(
      Number.isFinite(sessionUserId) ? sessionUserId : null,
      authorized,
    );

    return NextResponse.json({
      primary: {
        key: "primary" as const,
        label: `${primary.name} (${primary.email})`,
        email: primary.email,
      },
      options,
      defaultKey,
    });
  } catch (e) {
    console.error("GET /api/admin/email/authorized-senders:", e);
    return NextResponse.json({ error: "Failed to load senders" }, { status: 500 });
  }
}
