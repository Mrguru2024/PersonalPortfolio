import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/analytics/engagement — engagement stats and decision-support insights. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const stats = await storage.getCrmEngagementStats();
    const alerts = await storage.getCrmAlerts(undefined, true);
    const insights: string[] = [];
    if (stats.documentViews > 0 && stats.highIntentLeadsCount > 0) {
      insights.push("Leads that open proposals more than once show higher conversion intent.");
    }
    if (stats.emailClicks > 0) {
      insights.push("Email click-through leads are more likely to book a call.");
    }
    if (stats.highIntentLeadsCount > 0) {
      insights.push("Prioritize follow-up with High Intent and Hot Lead contacts.");
    }
    insights.push("Leads who revisit the pricing or audit page within 24 hours often show high purchase intent.");
    return NextResponse.json({
      ...stats,
      recentUnreadAlerts: alerts.slice(0, 10),
      insights,
    });
  } catch (error: any) {
    console.error("CRM engagement analytics error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
