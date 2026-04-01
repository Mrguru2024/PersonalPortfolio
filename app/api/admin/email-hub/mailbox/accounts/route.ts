import { NextRequest, NextResponse } from "next/server";
import { listMailboxAccountsForUser } from "@server/services/emailHub/mailbox/emailHubMailboxAccess";
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
  const rows = await listMailboxAccountsForUser(user.id, isSuper);
  const safe = rows.map(({ encryptedRefreshToken: _e, ...rest }) => rest);
  return NextResponse.json({ accounts: safe });
}
