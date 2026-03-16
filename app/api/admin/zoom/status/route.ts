import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { isZoomConfigured } from "@/lib/zoom";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/zoom/status
 * Returns whether Zoom is configured so the UI can show/hide Schedule with Zoom.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ configured: isZoomConfigured() });
  } catch {
    return NextResponse.json({ configured: false });
  }
}
