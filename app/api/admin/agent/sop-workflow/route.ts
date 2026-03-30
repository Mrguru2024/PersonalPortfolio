import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { loadAscendraSopWorkflowConfig } from "@server/services/ascendraSopWorkflowLoader";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET — merged SOP workflow config (defaults + optional JSON override) for admins / tooling. */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const user = await getSessionUser(req);
  if (!user?.adminApproved) {
    return NextResponse.json({ message: "Approved admin required" }, { status: 403 });
  }
  const config = await loadAscendraSopWorkflowConfig();
  const overridePath = process.env.ASCENDRA_SOP_WORKFLOW_JSON?.trim() || null;
  return NextResponse.json({
    config,
    overridePath,
    overrideActive: Boolean(overridePath),
  });
}
