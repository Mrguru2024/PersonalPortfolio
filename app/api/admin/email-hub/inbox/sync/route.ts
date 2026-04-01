import { NextRequest, NextResponse } from "next/server";
import { syncEmailHubMailboxAccount } from "@server/services/emailHub/mailbox/emailHubMailboxSync";
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
  let body: { mailboxAccountId?: number };
  try {
    body = (await req.json()) as { mailboxAccountId?: number };
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const mailboxAccountId = body.mailboxAccountId;
  if (mailboxAccountId == null || !Number.isFinite(Number(mailboxAccountId))) {
    return NextResponse.json({ message: "mailboxAccountId required" }, { status: 400 });
  }
  const okAccess = await userMayAccessMailbox(Number(mailboxAccountId), user.id, isSuper);
  if (!okAccess) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const r = await syncEmailHubMailboxAccount(Number(mailboxAccountId));
  if (!r.ok) return NextResponse.json({ message: r.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
