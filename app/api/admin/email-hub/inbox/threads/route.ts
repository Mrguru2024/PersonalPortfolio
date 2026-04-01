import { NextRequest, NextResponse } from "next/server";
import { listInboxThreads, userMayAccessMailbox } from "@server/services/emailHub/mailbox/emailHubMailboxAccess";
import { requireEmailHubSession } from "../../lib/session";
import { resolveEmailHubSuperUser } from "@server/services/emailHub/emailHubService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const isSuper = resolveEmailHubSuperUser({
    username: user.username,
    email: user.email,
    role: user.role,
    isSuperUser: user.isSuperUser,
  });
  const mailboxId = Number(new URL(req.url).searchParams.get("mailboxId"));
  if (!Number.isFinite(mailboxId)) {
    return NextResponse.json({ message: "mailboxId query required" }, { status: 400 });
  }
  const ok = await userMayAccessMailbox(mailboxId, user.id, isSuper);
  if (!ok) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim() || undefined;
  const unreadOnly = sp.get("unreadOnly") === "1" || sp.get("unread") === "1";
  const archivedRaw = sp.get("archived");
  const archived: "exclude" | "only" | "all" =
    archivedRaw === "1" || archivedRaw === "only" ? "only" : archivedRaw === "all" ? "all" : "exclude";
  const fromEmail = sp.get("from")?.trim() || undefined;
  const limit = sp.get("limit") ? Number(sp.get("limit")) : undefined;

  const threads = await listInboxThreads(mailboxId, {
    q,
    unreadOnly,
    archived,
    fromEmail,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  return NextResponse.json({ threads });
}
