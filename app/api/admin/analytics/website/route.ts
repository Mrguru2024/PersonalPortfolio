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

    const emptyTraffic = {
      totalEvents: 0,
      uniqueVisitors: 0,
      byPage: [] as { page: string; count: number; unique: number }[],
      byEventType: [] as { eventType: string; count: number }[],
      byDevice: [] as { device: string; count: number }[],
      byReferrer: [] as { referrer: string; count: number }[],
      byCountry: [] as { country: string; count: number; unique: number }[],
      byRegion: [] as { region: string; country: string; count: number }[],
      byCity: [] as { city: string; region: string; country: string; count: number }[],
      byTimezone: [] as { timezone: string; count: number }[],
    };
    const emptyLeadMagnets = {
      totalLeads: 0,
      bySource: [] as { source: string; label: string; count: number }[],
      recentCount: 0,
    };
    const emptyCrm = {
      emailOpens: 0,
      emailClicks: 0,
      documentViews: 0,
      highIntentLeadsCount: 0,
      unreadAlertsCount: 0,
    };
    const emptyDemographics = {
      byAgeRange: [] as { value: string; count: number }[],
      byGender: [] as { value: string; count: number }[],
      byOccupation: [] as { value: string; count: number }[],
      byCompanySize: [] as { value: string; count: number }[],
      totalWithDemographics: 0,
    };

    const [traffic, leadMagnets, crmEngagement, leadDemographics] = await Promise.all([
      storage.getWebsiteTrafficAnalytics(since).catch((e) => {
        console.warn("Website traffic analytics failed:", e);
        return emptyTraffic;
      }),
      storage.getLeadMagnetPerformance(since).catch((e) => {
        console.warn("Lead magnet performance failed:", e);
        return emptyLeadMagnets;
      }),
      storage.getCrmEngagementStats().catch((e) => {
        console.warn("CRM engagement stats failed:", e);
        return emptyCrm;
      }),
      storage.getLeadDemographics(since).catch((e) => {
        console.warn("Lead demographics failed:", e);
        return emptyDemographics;
      }),
    ]);

    const t = traffic ?? emptyTraffic;
    const lm = leadMagnets ?? emptyLeadMagnets;
    const crm = crmEngagement ?? emptyCrm;
    const demographics = leadDemographics ?? emptyDemographics;

    const insights: string[] = [];
    const nextActions: { action: string; priority: "high" | "medium" | "low"; reason: string }[] = [];

    if (t.totalEvents === 0 && t.uniqueVisitors === 0) {
      insights.push("No visitor tracking data yet. Ensure the site calls POST /api/track/visitor on key pages and CTAs.");
      nextActions.push({
        action: "Add visitor tracking to key pages (audit, strategy-call, contact, funnel pages)",
        priority: "high",
        reason: "Traffic and lead-magnet analytics depend on it.",
      });
    } else {
      const topPage = t.byPage?.[0];
      if (topPage) {
        insights.push(`Top page: ${topPage.page} (${topPage.count} views, ${topPage.unique} unique visitors).`);
      }
      if (t.byEventType?.some((e) => e.eventType === "form_completed")) {
        const completed = t.byEventType.find((e) => e.eventType === "form_completed")?.count ?? 0;
        insights.push(`Form completions recorded: ${completed}. Compare with lead magnet counts to validate funnel.`);
      }
    }

    if (lm.totalLeads === 0) {
      insights.push("No contact form submissions in the selected period. Check audit, strategy-call, and contact flows.");
      nextActions.push({
        action: "Promote audit and strategy-call CTAs on homepage and high-traffic pages",
        priority: "medium",
        reason: "More visibility increases lead capture.",
      });
    } else {
      const topSource = lm.bySource?.[0];
      if (topSource) {
        insights.push(`Best-performing lead source: ${topSource.label} (${topSource.count} leads).`);
        nextActions.push({
          action: `Double down on ${topSource.label}: add CTAs and follow-up content`,
          priority: "high",
          reason: "It’s already converting; amplify it.",
        });
      }
      const weak = (lm.bySource ?? []).filter((s) => s.count === 0);
      if (weak.length > 0) {
        nextActions.push({
          action: `Consider promoting or simplifying: ${weak.map((s) => s.label).join(", ")}`,
          priority: "low",
          reason: "These sources have no leads in the period.",
        });
      }
    }

    if (crm.highIntentLeadsCount > 0) {
      insights.push(`${crm.highIntentLeadsCount} high-intent/hot leads in CRM. Prioritize follow-up.`);
      nextActions.push({
        action: "Review CRM for high-intent and hot leads; schedule follow-up",
        priority: "high",
        reason: "These leads are most likely to convert.",
      });
    }
    if (crm.unreadAlertsCount > 0) {
      nextActions.push({
        action: `Review ${crm.unreadAlertsCount} unread CRM alerts (e.g. proposal views)`,
        priority: "medium",
        reason: "Alerts indicate engagement; timely response improves conversion.",
      });
    }

    return NextResponse.json({
      traffic: t,
      leadMagnets: lm,
      crmEngagement: crm,
      leadDemographics: demographics,
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
