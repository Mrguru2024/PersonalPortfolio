import { NextRequest, NextResponse } from "next/server";
import {
  userMayAccessMailbox,
  setInboxThreadArchived,
} from "@server/services/emailHub/mailbox/emailHubMailboxAccess";
import { requireEmailHubSession } from "../../../../lib/session";
import { resolveEmailHubSuperUser } from "@server/services/emailHub/emailHubService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** PATCH archive state — body: { mailboxId: number, archived: boolean } */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const isSuper = resolveEmailHubSuperUser({
    username: user.username,
    email: user.email,
    role: user.role,
    isSuperUser: user.isSuperUser,
  });
  const threadId = Number((await ctx.params).id);
  if (!Number.isFinite(threadId)) {
    return NextResponse.json({ message: "Invalid thread id" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const mailboxId = body.mailboxId != null ? Number(body.mailboxId) : NaN;
  const archived = Boolean(body.archived);
  if (!Number.isFinite(mailboxId)) {
    return NextResponse.json({ message: "mailboxId required" }, { status: 400 });
  }
  const ok = await userMayAccessMailbox(mailboxId, user.id, isSuper);
  if (!ok) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const updated = await setInboxThreadArchived(threadId, mailboxId, archived);
  if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, threadId, archived });
}
