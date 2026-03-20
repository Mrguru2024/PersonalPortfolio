import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  fetchTextFromAllowedUrl,
  parseIcalVevents,
  calendarRowsFromCsv,
  importCalendarRows,
} from "@server/services/internalStudio/contentExchangeService";
import { logGosAccessEvent } from "@server/services/growthOsFoundationService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  projectKey: z.string().default("ascendra_main"),
  /** Google Calendar iCal secret URL or Google Sheets published CSV export URL */
  url: z.string().url().max(2048),
  /** ical | sheet_csv */
  kind: z.enum(["ical", "sheet_csv"]),
});

/**
 * POST /api/admin/content-studio/import-url
 * Fetches from allowlisted Google hosts only (SSRF-safe).
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await getSessionUser(req);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const { projectKey, url, kind } = parsed.data;
    const text = await fetchTextFromAllowedUrl(url);

    if (kind === "ical") {
      const events = parseIcalVevents(text);
      const rows = events.map((e) => ({
        title: e.summary.slice(0, 500),
        scheduledAt: e.start,
        timezone: "UTC",
        calendarStatus: "draft" as const,
        platformTargets: [] as string[],
      }));
      const result = await importCalendarRows(projectKey, rows);
      await logGosAccessEvent({
        actorUserId: user?.id ?? null,
        action: "content_studio_import_url_ical",
        resourceType: "internal_editorial_calendar",
        resourceId: projectKey,
        metadata: { created: result.created, host: new URL(url).hostname },
      });
      return NextResponse.json({ ...result, eventsParsed: events.length, source: "google_calendar_ical" });
    }

    const rows = calendarRowsFromCsv(text);
    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No calendar rows from sheet — use columns title,scheduled_at (ISO), optional timezone,platform_targets",
        },
        { status: 400 },
      );
    }
    const result = await importCalendarRows(projectKey, rows);
    await logGosAccessEvent({
      actorUserId: user?.id ?? null,
      action: "content_studio_import_url_sheet",
      resourceType: "internal_editorial_calendar",
      resourceId: projectKey,
      metadata: { created: result.created, host: new URL(url).hostname },
    });
    return NextResponse.json({ ...result, rowsParsed: rows.length, source: "google_sheets_csv" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    console.error(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
