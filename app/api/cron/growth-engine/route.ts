import { NextRequest, NextResponse } from "next/server";
import { processDueAutomationRuns } from "@server/services/growthEngine/leadSignalEngine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET — process pending automation runs (Bearer CRON_SECRET in production). */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = req.headers.get("authorization")?.trim();
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  await processDueAutomationRuns(40);
  return NextResponse.json({ ok: true });
}
