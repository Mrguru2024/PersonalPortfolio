import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/dashboard — Stage 1 CRM overview stats. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const stats = await storage.getCrmDashboardStats();
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/crm_accounts.*does not exist|crm_activity_log.*does not exist/i.test(msg)) {
      return NextResponse.json({
        totalContacts: 0,
        totalAccounts: 0,
        totalActiveLeads: 0,
        leadsMissingData: 0,
        leadsByPipelineStage: [],
        recentTasks: [],
        overdueTasks: [],
        recentActivity: [],
        accountsNeedingResearch: 0,
        topSources: [],
        topTags: [],
      });
    }
    console.error("Error fetching CRM dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
