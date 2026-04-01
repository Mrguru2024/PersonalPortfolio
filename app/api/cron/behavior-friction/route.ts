import { NextRequest, NextResponse } from "next/server";
import { runBehaviorFrictionSweep } from "@server/services/behavior/behaviorFrictionJob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/cron/behavior-friction — aggregate friction reports (Bearer CRON_SECRET in production). */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = req.headers.get("authorization")?.trim();
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const inserted = await runBehaviorFrictionSweep(since);
  return NextResponse.json({ ok: true, reportsInserted: inserted, since: since.toISOString() });
}
