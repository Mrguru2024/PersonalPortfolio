import { NextRequest, NextResponse } from "next/server";
import { purgeEmailHubInboxPastRetention } from "@server/services/emailHub/emailHubInboxRetention";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Daily: drop non-archived inbox message copies older than EMAIL_HUB_INBOX_RETENTION_DAYS (default 90). */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  const okSecret = secret && auth === `Bearer ${secret}`;
  if (!okSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await purgeEmailHubInboxPastRetention();
  return NextResponse.json(result);
}
