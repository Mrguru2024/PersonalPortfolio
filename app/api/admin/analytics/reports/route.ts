import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/analytics/reports — filtered event report with summary. Admin only. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sinceParam = searchParams.get("since");
    const untilParam = searchParams.get("until");
    const eventType = searchParams.get("eventType") ?? undefined;
    const page = searchParams.get("page") ?? undefined;
    const deviceType = searchParams.get("deviceType") ?? undefined;
    const country = searchParams.get("country") ?? undefined;
    const region = searchParams.get("region") ?? undefined;
    const city = searchParams.get("city") ?? undefined;
    const timezone = searchParams.get("timezone") ?? undefined;
    const referrer = searchParams.get("referrer") ?? undefined;
    const utmSource = searchParams.get("utm_source") ?? searchParams.get("utmSource") ?? undefined;
    const utmMedium = searchParams.get("utm_medium") ?? searchParams.get("utmMedium") ?? undefined;
    const utmCampaign = searchParams.get("utm_campaign") ?? searchParams.get("utmCampaign") ?? undefined;
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const since = sinceParam ? new Date(sinceParam) : undefined;
    const until = untilParam ? new Date(untilParam) : undefined;
    const limit = limitParam ? Math.min(5000, Math.max(1, Number.parseInt(limitParam, 10) || 500)) : 500;
    const offset = offsetParam ? Math.max(0, Number.parseInt(offsetParam, 10) || 0) : 0;

    const filters = {
      since,
      until,
      eventType,
      page,
      deviceType,
      country,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      limit,
      offset,
    };

    const { events, total } = await storage.getVisitorActivityFiltered(filters);

    const summary = {
      total,
      returned: events.length,
      filtersApplied: {
        since: since?.toISOString() ?? null,
        until: until?.toISOString() ?? null,
        eventType: eventType ?? null,
        page: page ?? null,
        deviceType: deviceType ?? null,
        country: country ?? null,
        region: region ?? null,
        city: city ?? null,
        timezone: timezone ?? null,
        referrer: referrer ?? null,
        utm_source: utmSource ?? null,
        utm_medium: utmMedium ?? null,
        utm_campaign: utmCampaign ?? null,
      },
    };

    const eventsSerialized = events.map((e) => ({
      id: e.id,
      visitorId: e.visitorId,
      sessionId: e.sessionId,
      pageVisited: e.pageVisited,
      eventType: e.eventType,
      referrer: e.referrer,
      deviceType: e.deviceType,
      country: e.country,
      region: e.region,
      city: e.city,
      timezone: e.timezone,
      metadata: e.metadata,
      createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
    }));

    return NextResponse.json({
      summary,
      events: eventsSerialized,
    });
  } catch (error: unknown) {
    console.error("Reports error:", error);
    return NextResponse.json(
      { error: "Failed to load report" },
      { status: 500 }
    );
  }
}
