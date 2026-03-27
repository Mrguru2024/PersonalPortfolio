import { NextRequest, NextResponse } from "next/server";
import { processScheduledEmailHubDrafts, processScheduledEmailHubMessages } from "@server/services/emailHub/emailHubService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  const okSecret = secret && auth === `Bearer ${secret}`;
  if (!okSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const msgs = await processScheduledEmailHubMessages();
  const drafts = await processScheduledEmailHubDrafts();
  return NextResponse.json({ ...msgs, ...drafts });
}
