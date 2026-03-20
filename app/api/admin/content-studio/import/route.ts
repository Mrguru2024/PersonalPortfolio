import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  parseIcalVevents,
  calendarRowsFromCsv,
  importCalendarRows,
  documentsFromCsv,
  documentsFromJson,
  importDocuments,
} from "@server/services/internalStudio/contentExchangeService";
import { logGosAccessEvent } from "@server/services/growthOsFoundationService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  projectKey: z.string().default("ascendra_main"),
  target: z.enum(["calendar", "documents"]),
  format: z.enum(["csv", "json", "ical"]),
  payload: z.string().min(1).max(2_000_000),
});

/**
 * POST /api/admin/content-studio/import
 * Body: { projectKey, target, format, payload } — raw text (CSV, iCal, or JSON array for documents).
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await getSessionUser(req);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const { projectKey, target, format, payload } = parsed.data;

    if (target === "calendar") {
      if (format === "ical") {
        const events = parseIcalVevents(payload);
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
          action: "content_studio_import_ical",
          resourceType: "internal_editorial_calendar",
          resourceId: projectKey,
          metadata: { created: result.created, format: "ical" },
        });
        return NextResponse.json({ ...result, source: "ical" });
      }
      if (format === "csv") {
        const rows = calendarRowsFromCsv(payload);
        if (rows.length === 0) {
          return NextResponse.json(
            { error: "No rows parsed — use headers: title,scheduled_at,timezone,..." },
            { status: 400 },
          );
        }
        const result = await importCalendarRows(projectKey, rows);
        await logGosAccessEvent({
          actorUserId: user?.id ?? null,
          action: "content_studio_import_csv_calendar",
          resourceType: "internal_editorial_calendar",
          resourceId: projectKey,
          metadata: { created: result.created },
        });
        return NextResponse.json({ ...result, source: "csv" });
      }
      return NextResponse.json({ error: "Calendar import supports ical or csv" }, { status: 400 });
    }

    if (target === "documents") {
      if (format === "json") {
        let data: unknown;
        try {
          data = JSON.parse(payload);
        } catch {
          return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const rows = documentsFromJson(data);
        const result = await importDocuments(projectKey, rows);
        await logGosAccessEvent({
          actorUserId: user?.id ?? null,
          action: "content_studio_import_json_documents",
          resourceType: "internal_cms_documents",
          resourceId: projectKey,
          metadata: { created: result.created },
        });
        return NextResponse.json({ ...result, source: "json" });
      }
      if (format === "csv") {
        const rows = documentsFromCsv(payload);
        if (rows.length === 0) {
          return NextResponse.json({ error: "No rows — need title column" }, { status: 400 });
        }
        const result = await importDocuments(projectKey, rows);
        await logGosAccessEvent({
          actorUserId: user?.id ?? null,
          action: "content_studio_import_csv_documents",
          resourceType: "internal_cms_documents",
          resourceId: projectKey,
          metadata: { created: result.created },
        });
        return NextResponse.json({ ...result, source: "csv" });
      }
      return NextResponse.json({ error: "Documents import supports csv or json" }, { status: 400 });
    }

    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
