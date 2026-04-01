import { NextRequest, NextResponse } from "next/server";
import { replyToEmailHubThread } from "@server/services/emailHub/mailbox/emailHubMailboxActions";
import { userMayAccessMailbox } from "@server/services/emailHub/mailbox/emailHubMailboxAccess";
import { requireEmailHubSession } from "../../lib/session";
import { resolveEmailHubSuperUser } from "@server/services/emailHub/emailHubService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const isSuper = resolveEmailHubSuperUser({
    username: user.username,
    email: user.email,
    role: user.role,
    isSuperUser: user.isSuperUser,
  });
  let body: { mailboxAccountId?: number; threadId?: number; htmlBody?: string };
  try {
    body = (await req.json()) as { mailboxAccountId?: number; threadId?: number; htmlBody?: string };
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const mailboxAccountId = body.mailboxAccountId;
  const threadId = body.threadId;
  const htmlBody = typeof body.htmlBody === "string" ? body.htmlBody : "";
  if (
    mailboxAccountId == null ||
    !Number.isFinite(Number(mailboxAccountId)) ||
    threadId == null ||
    !Number.isFinite(Number(threadId))
  ) {
    return NextResponse.json({ message: "mailboxAccountId and threadId required" }, { status: 400 });
  }
  if (!htmlBody.trim()) return NextResponse.json({ message: "htmlBody required" }, { status: 400 });
  const ok = await userMayAccessMailbox(Number(mailboxAccountId), user.id, isSuper);
  if (!ok) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const r = await replyToEmailHubThread({
    mailboxAccountId: Number(mailboxAccountId),
    threadId: Number(threadId),
    htmlBody,
  });
  if (!r.ok) return NextResponse.json({ message: r.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
