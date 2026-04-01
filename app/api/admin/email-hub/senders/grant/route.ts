import { NextRequest, NextResponse } from "next/server";
import {
  grantSenderPermission,
  resolveApprovedAdminUserIdByEmailOrUsername,
} from "@server/services/emailHub/emailHubService";
import { requireEmailHubSession } from "../../lib/session";

export async function POST(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user?.isSuper) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as {
    userId?: number;
    emailOrUsername?: string;
    emailSenderId?: number;
  };
  if (!body.emailSenderId) {
    return NextResponse.json({ error: "emailSenderId required" }, { status: 400 });
  }

  let grantUserId: number | null = null;
  if (typeof body.emailOrUsername === "string" && body.emailOrUsername.trim()) {
    const resolved = await resolveApprovedAdminUserIdByEmailOrUsername(body.emailOrUsername);
    if (resolved == null) {
      return NextResponse.json(
        {
          error: `No approved admin found matching "${body.emailOrUsername.trim()}". Use their login email or username.`,
        },
        { status: 400 },
      );
    }
    grantUserId = resolved;
  } else if (body.userId != null && Number.isFinite(Number(body.userId)) && Number(body.userId) > 0) {
    grantUserId = Number(body.userId);
  }

  if (grantUserId == null) {
    return NextResponse.json(
      { error: "Provide emailOrUsername or userId together with emailSenderId." },
      { status: 400 },
    );
  }

  try {
    await grantSenderPermission(grantUserId, body.emailSenderId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Grant failed (may already exist)" }, { status: 400 });
  }
}
