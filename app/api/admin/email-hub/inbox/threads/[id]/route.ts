import { NextRequest, NextResponse } from "next/server";
import {
  getInboxThreadById,
  listThreadMessages,
  userMayAccessMailbox,
} from "@server/services/emailHub/mailbox/emailHubMailboxAccess";
import { requireEmailHubSession } from "../../../lib/session";
import { resolveEmailHubSuperUser } from "@server/services/emailHub/emailHubService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const isSuper = resolveEmailHubSuperUser({
    username: user.username,
    email: user.email,
    role: user.role,
    isSuperUser: user.isSuperUser,
  });
  const threadId = Number((await ctx.params).id);
  const mailboxId = Number(new URL(req.url).searchParams.get("mailboxId"));
  if (!Number.isFinite(threadId) || !Number.isFinite(mailboxId)) {
    return NextResponse.json({ message: "Invalid thread or mailboxId" }, { status: 400 });
  }
  const ok = await userMayAccessMailbox(mailboxId, user.id, isSuper);
  if (!ok) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const thread = await getInboxThreadById(threadId, mailboxId);
  if (!thread) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const messages = await listThreadMessages(threadId, mailboxId);
  return NextResponse.json({ thread, messages });
}
