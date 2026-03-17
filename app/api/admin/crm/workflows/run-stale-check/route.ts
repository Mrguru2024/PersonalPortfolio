import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { runStaleCheck } from "@server/services/workflows/staleCheck";

export const dynamic = "force-dynamic";

/** POST /api/admin/crm/workflows/run-stale-check — run stale-lead, missing-research, missing-qualification detection and fire workflows. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const maxPerCategory = typeof body.maxPerCategory === "number" ? body.maxPerCategory : 20;
    const staleDays = typeof body.staleDays === "number" ? body.staleDays : 14;

    const result = await runStaleCheck(storage, { maxPerCategory, staleDays });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Stale check error:", error);
    return NextResponse.json({ error: "Failed to run stale check" }, { status: 500 });
  }
}
