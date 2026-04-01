import { NextRequest, NextResponse } from "next/server";
import { syncAllEnabledMailboxes } from "@server/services/emailHub/mailbox/emailHubMailboxSync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  const okSecret = secret && auth === `Bearer ${secret}`;
  if (!okSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await syncAllEnabledMailboxes();
  return NextResponse.json(result);
}
