import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/ltv — aggregated LTV / pipeline snapshot for the admin workspace. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const snapshot = await storage.getCrmLtvSnapshot();
    return NextResponse.json(snapshot);
  } catch (error: unknown) {
    console.error("Error fetching CRM LTV snapshot:", error);
    return NextResponse.json({ error: "Failed to fetch LTV snapshot" }, { status: 500 });
  }
}
