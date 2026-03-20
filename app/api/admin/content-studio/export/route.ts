import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  exportCalendarCsv,
  exportCalendarJson,
  exportDocumentsCsv,
} from "@server/services/internalStudio/contentExchangeService";
import { db } from "@server/db";
import { internalCmsDocuments } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/content-studio/export?kind=calendar|documents&format=csv|json&projectKey=&from=&to=
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind") ?? "calendar";
    const format = searchParams.get("format") ?? "csv";
    const projectKey = searchParams.get("projectKey") ?? "ascendra_main";
    const fromS = searchParams.get("from");
    const toS = searchParams.get("to");
    const from = fromS ? new Date(fromS) : undefined;
    const to = toS ? new Date(toS) : undefined;

    if (kind === "calendar") {
      if (format === "json") {
        const rows = await exportCalendarJson(projectKey, from, to);
        return NextResponse.json({ projectKey, entries: rows });
      }
      const csv = await exportCalendarCsv(projectKey, from, to);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="editorial-calendar-${projectKey}.csv"`,
        },
      });
    }

    if (kind === "documents") {
      if (format === "json") {
        const rows = await db
          .select()
          .from(internalCmsDocuments)
          .where(eq(internalCmsDocuments.projectKey, projectKey))
          .orderBy(desc(internalCmsDocuments.updatedAt))
          .limit(500);
        return NextResponse.json({ projectKey, documents: rows });
      }
      const csv = await exportDocumentsCsv(projectKey);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="internal-documents-${projectKey}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
