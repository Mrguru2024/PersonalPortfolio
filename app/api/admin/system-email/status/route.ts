import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getPublicIonosMailStatus } from "@server/services/ionosMail/ionosEnv";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/system-email/status
 * Admin only. Non-secret IONOS mailbox configuration summary.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json(getPublicIonosMailStatus());
  } catch (e) {
    console.error("GET /api/admin/system-email/status:", e);
    return NextResponse.json({ error: "Failed to load status" }, { status: 500 });
  }
}
