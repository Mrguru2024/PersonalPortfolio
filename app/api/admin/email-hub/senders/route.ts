import { NextRequest, NextResponse } from "next/server";
import {
  adminUpsertEmailHubSender,
  listSendersForUser,
  resolveApprovedAdminUserIdByEmailOrUsername,
} from "@server/services/emailHub/emailHubService";
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
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    let grantUserId: number | null = body.grantUserId != null ? Number(body.grantUserId) : null;
    const grantEmailOrUsername =
      typeof body.grantEmailOrUsername === "string" ? body.grantEmailOrUsername.trim() : "";
    if (grantEmailOrUsername) {
      if (!user.isSuper) {
        return NextResponse.json({ error: "Only super admins can grant sender access by email or username." }, { status: 403 });
      }
      const resolved = await resolveApprovedAdminUserIdByEmailOrUsername(grantEmailOrUsername);
      if (resolved == null) {
        return NextResponse.json(
          {
            error: `No approved admin found matching "${grantEmailOrUsername}". Use their login email or username.`,
          },
          { status: 400 },
        );
      }
      grantUserId = resolved;
    } else if (grantUserId != null && Number.isFinite(grantUserId) && grantUserId > 0) {
      if (!user.isSuper) {
        return NextResponse.json({ error: "Only super admins can grant sender access." }, { status: 403 });
      }
    } else {
      grantUserId = null;
    }

    const row = await adminUpsertEmailHubSender(user.id, user.isSuper, {
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
      grantUserId,
    });
    return NextResponse.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    const status = msg === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
