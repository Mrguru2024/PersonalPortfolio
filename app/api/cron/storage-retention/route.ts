import { NextRequest, NextResponse } from "next/server";
import { runAscendraStorageRetentionSweep } from "@server/services/ascendraStorageRetention";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Daily soft-delete (90d default) + hard-delete after grace (30d default). Bearer CRON_SECRET in production. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = req.headers.get("authorization")?.trim();
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const result = await runAscendraStorageRetentionSweep();
  return NextResponse.json({ ok: true, ...result });
}
