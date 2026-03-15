import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/alerts — list alerts (optionally by leadId, unreadOnly). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const alerts = await storage.getCrmAlerts(
      leadId ? Number(leadId) : undefined,
      unreadOnly
    );
    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error("CRM alerts error:", error);
    return NextResponse.json({ error: "Failed to load alerts" }, { status: 500 });
  }
}
