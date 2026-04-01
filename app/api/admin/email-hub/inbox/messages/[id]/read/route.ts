import { NextRequest, NextResponse } from "next/server";
import {
  getInboxMessageById,
  userMayAccessMailbox,
} from "@server/services/emailHub/mailbox/emailHubMailboxAccess";
import { setEmailHubProviderMessageReadState } from "@server/services/emailHub/mailbox/emailHubMailboxActions";
import { requireEmailHubSession } from "../../../../lib/session";
import { resolveEmailHubSuperUser } from "@server/services/emailHub/emailHubService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const isSuper = resolveEmailHubSuperUser({
    username: user.username,
    email: user.email,
    role: user.role,
    isSuperUser: user.isSuperUser,
  });
  const messageId = Number((await ctx.params).id);
  let body: { mailboxId?: number; read?: boolean };
  try {
    body = (await req.json()) as { mailboxId?: number; read?: boolean };
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const mailboxId = body.mailboxId;
  const read = body.read;
  if (!Number.isFinite(messageId) || mailboxId == null || !Number.isFinite(Number(mailboxId))) {
    return NextResponse.json({ message: "Invalid message or mailboxId" }, { status: 400 });
  }
  if (typeof read !== "boolean") return NextResponse.json({ message: "read boolean required" }, { status: 400 });
  const ok = await userMayAccessMailbox(Number(mailboxId), user.id, isSuper);
  if (!ok) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const msgRow = await getInboxMessageById(messageId, Number(mailboxId));
  if (!msgRow) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const r = await setEmailHubProviderMessageReadState({
    mailboxAccountId: Number(mailboxId),
    providerMessageId: msgRow.providerMessageId,
    isRead: read,
  });
  if (!r.ok) return NextResponse.json({ message: r.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
