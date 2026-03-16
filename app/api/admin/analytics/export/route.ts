import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/analytics/export — export filtered events as CSV or JSON. Admin only. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") ?? "csv").toLowerCase();
    if (format !== "csv" && format !== "json") {
      return NextResponse.json({ error: "format must be csv or json" }, { status: 400 });
    }

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
    const limit = limitParam ? Math.min(10000, Math.max(1, Number.parseInt(limitParam, 10) || 2000)) : 2000;

    const { events } = await storage.getVisitorActivityFiltered({
      since: sinceParam ? new Date(sinceParam) : undefined,
      until: untilParam ? new Date(untilParam) : undefined,
      eventType,
      page,
      deviceType,
      country,
      region,
      city,
      timezone,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      limit,
      offset: 0,
    });

    const rows = events.map((e) => ({
      id: e.id,
      visitorId: e.visitorId,
      sessionId: e.sessionId ?? "",
      pageVisited: e.pageVisited ?? "",
      eventType: e.eventType,
      referrer: e.referrer ?? "",
      deviceType: e.deviceType ?? "",
      country: e.country ?? "",
      region: e.region ?? "",
      city: e.city ?? "",
      timezone: e.timezone ?? "",
      utm_source: (e.metadata as Record<string, unknown> | null)?.utm_source ?? "",
      utm_medium: (e.metadata as Record<string, unknown> | null)?.utm_medium ?? "",
      utm_campaign: (e.metadata as Record<string, unknown> | null)?.utm_campaign ?? "",
      createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
    }));

    if (format === "json") {
      return new NextResponse(JSON.stringify(rows, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="analytics-export-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    }

    const headers = ["id", "visitorId", "sessionId", "pageVisited", "eventType", "referrer", "deviceType", "country", "region", "city", "timezone", "utm_source", "utm_medium", "utm_campaign", "createdAt"];
    const escapeCsv = (v: string | number) => {
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csvLines = [headers.join(","), ...rows.map((r) => headers.map((h) => {
      const v = (r as Record<string, unknown>)[h];
      const cell = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : v;
      return escapeCsv(typeof cell === "number" ? cell : String(cell));
    }).join(","))];
    const csv = csvLines.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}
