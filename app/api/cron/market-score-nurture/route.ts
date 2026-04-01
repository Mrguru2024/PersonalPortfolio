import { NextRequest, NextResponse } from "next/server";
import { processDueMarketScoreNurtureJobs } from "@server/services/marketScoreNurtureProcessor";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  const okSecret = secret && auth === `Bearer ${secret}`;
  if (!okSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const out = await processDueMarketScoreNurtureJobs(40);
  return NextResponse.json(out);
}
