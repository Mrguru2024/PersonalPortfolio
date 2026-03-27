import { NextRequest, NextResponse } from "next/server";
import { listSendersForUser, adminUpsertEmailHubSender } from "@server/services/emailHub/emailHubService";
import { requireEmailHubSession } from "../lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const senders = await listSendersForUser(user.id, user.isSuper);
  return NextResponse.json(senders);
}

export async function POST(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.isSuper) return NextResponse.json({ error: "Super admin required" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const row = await adminUpsertEmailHubSender({
      id: body.id != null ? Number(body.id) : undefined,
      founderUserId: body.founderUserId != null ? Number(body.founderUserId) : null,
      brevoSenderId: body.brevoSenderId != null ? String(body.brevoSenderId) : null,
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      replyToEmail: body.replyToEmail != null ? String(body.replyToEmail) : null,
      replyToName: body.replyToName != null ? String(body.replyToName) : null,
      isVerified: Boolean(body.isVerified),
      isDefault: Boolean(body.isDefault),
      signatureHtml: body.signatureHtml != null ? String(body.signatureHtml) : null,
      brandProfileId: body.brandProfileId != null ? Number(body.brandProfileId) : null,
      grantUserId: body.grantUserId != null ? Number(body.grantUserId) : null,
    });
    return NextResponse.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
