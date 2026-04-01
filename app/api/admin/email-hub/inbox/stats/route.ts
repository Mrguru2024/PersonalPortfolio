import { NextRequest, NextResponse } from "next/server";
import { userMayAccessMailbox } from "@server/services/emailHub/mailbox/emailHubMailboxAccess";
import { requireEmailHubSession } from "../../lib/session";
import { resolveEmailHubSuperUser } from "@server/services/emailHub/emailHubService";
import { estimateInboxMailboxBytes } from "@server/services/emailHub/emailHubInboxRetention";
import { emailHubInboxLimitsForApi } from "@server/services/emailHub/emailHubLimits";

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

  const usage = await estimateInboxMailboxBytes(mailboxId);
  const limits = emailHubInboxLimitsForApi();

  return NextResponse.json({
    mailboxId,
    ...usage,
    limits,
    approxUsagePercent:
      limits.estimatedCapBytesPerMailbox > 0
        ? Math.min(100, Math.round((usage.approxBodyBytes / limits.estimatedCapBytesPerMailbox) * 100))
        : 0,
  });
}
