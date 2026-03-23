import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getOperationsDashboardPayload } from "@server/services/operationsDashboardService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const payload = await getOperationsDashboardPayload();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/admin/operations-dashboard failed:", error);
    return NextResponse.json({ message: "Failed to load operations dashboard" }, { status: 500 });
  }
}
