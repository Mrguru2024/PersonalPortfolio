import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/analytics/website — traffic flow, lead magnet performance, insights and next actions. Admin/super admin only. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const sinceParam = req.nextUrl.searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : undefined;

    const [traffic, leadMagnets, crmEngagement] = await Promise.all([
      storage.getWebsiteTrafficAnalytics(since),
      storage.getLeadMagnetPerformance(since),
      storage.getCrmEngagementStats().catch(() => ({
        emailOpens: 0,
        emailClicks: 0,
        documentViews: 0,
        highIntentLeadsCount: 0,
        unreadAlertsCount: 0,
      })),
    ]);

    const insights: string[] = [];
    const nextActions: { action: string; priority: "high" | "medium" | "low"; reason: string }[] = [];

    if (traffic.totalEvents === 0 && traffic.uniqueVisitors === 0) {
      insights.push("No visitor tracking data yet. Ensure the site calls POST /api/track/visitor on key pages and CTAs.");
      nextActions.push({
        action: "Add visitor tracking to key pages (audit, strategy-call, contact, funnel pages)",
        priority: "high",
        reason: "Traffic and lead-magnet analytics depend on it.",
      });
    } else {
      if (traffic.byPage.length > 0) {
        const topPage = traffic.byPage[0];
        insights.push(`Top page: ${topPage.page} (${topPage.count} views, ${topPage.unique} unique visitors).`);
      }
      if (traffic.byEventType.some((e) => e.eventType === "form_completed")) {
        const completed = traffic.byEventType.find((e) => e.eventType === "form_completed")?.count ?? 0;
        insights.push(`Form completions recorded: ${completed}. Compare with lead magnet counts to validate funnel.`);
      }
    }

    if (leadMagnets.totalLeads === 0) {
      insights.push("No contact form submissions in the selected period. Check audit, strategy-call, and contact flows.");
      nextActions.push({
        action: "Promote audit and strategy-call CTAs on homepage and high-traffic pages",
        priority: "medium",
        reason: "More visibility increases lead capture.",
      });
    } else {
      const topSource = leadMagnets.bySource[0];
      if (topSource) {
        insights.push(`Best-performing lead source: ${topSource.label} (${topSource.count} leads).`);
        nextActions.push({
          action: `Double down on ${topSource.label}: add CTAs and follow-up content`,
          priority: "high",
          reason: "It’s already converting; amplify it.",
        });
      }
      const weak = leadMagnets.bySource.filter((s) => s.count === 0);
      if (weak.length > 0) {
        nextActions.push({
          action: `Consider promoting or simplifying: ${weak.map((s) => s.label).join(", ")}`,
          priority: "low",
          reason: "These sources have no leads in the period.",
        });
      }
    }

    if (crmEngagement.highIntentLeadsCount > 0) {
      insights.push(`${crmEngagement.highIntentLeadsCount} high-intent/hot leads in CRM. Prioritize follow-up.`);
      nextActions.push({
        action: "Review CRM for high-intent and hot leads; schedule follow-up",
        priority: "high",
        reason: "These leads are most likely to convert.",
      });
    }
    if (crmEngagement.unreadAlertsCount > 0) {
      nextActions.push({
        action: `Review ${crmEngagement.unreadAlertsCount} unread CRM alerts (e.g. proposal views)`,
        priority: "medium",
        reason: "Alerts indicate engagement; timely response improves conversion.",
      });
    }

    return NextResponse.json({
      traffic,
      leadMagnets,
      crmEngagement,
      insights,
      nextActions,
    });
  } catch (error: unknown) {
    console.error("Website analytics error:", error);
    return NextResponse.json(
      { error: "Failed to load website analytics" },
      { status: 500 }
    );
  }
}
