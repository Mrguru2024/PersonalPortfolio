import { NextRequest, NextResponse } from "next/server";
import {
  deleteMailboxAccountCascade,
  getMailboxAccountById,
  userMayAccessMailbox,
} from "@server/services/emailHub/mailbox/emailHubMailboxAccess";
import { requireEmailHubSession } from "../../../lib/session";
import { resolveEmailHubSuperUser } from "@server/services/emailHub/emailHubService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const isSuper = resolveEmailHubSuperUser({
    username: user.username,
    email: user.email,
    role: user.role,
    isSuperUser: user.isSuperUser,
  });
  const id = Number((await ctx.params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  const ok = await userMayAccessMailbox(id, user.id, isSuper);
  if (!ok) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const row = await getMailboxAccountById(id);
  if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
  await deleteMailboxAccountCascade(id);
  return NextResponse.json({ ok: true });
}
