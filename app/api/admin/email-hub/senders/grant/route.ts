import { NextRequest, NextResponse } from "next/server";
import { grantSenderPermission } from "@server/services/emailHub/emailHubService";
import { requireEmailHubSession } from "../../lib/session";

export async function POST(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user?.isSuper) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { userId?: number; emailSenderId?: number };
  if (!body.userId || !body.emailSenderId) {
    return NextResponse.json({ error: "userId and emailSenderId required" }, { status: 400 });
  }
  try {
    await grantSenderPermission(body.userId, body.emailSenderId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Grant failed (may already exist)" }, { status: 400 });
  }
}
