import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { growthDiagnosisReports } from "@shared/schema";
import { eq } from "drizzle-orm";
import { buildNarrativeParagraph } from "@/lib/growth-diagnosis/narrative";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/growth-diagnosis/reports/[id]/export?format=json|text
 * Export report as JSON (full) or plain text narrative (admin only).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = (await params).id;
    const format = req.nextUrl.searchParams.get("format") || "json";
    if (!id) {
      return NextResponse.json({ message: "Report id required" }, { status: 400 });
    }
    const byNumericId = !Number.isNaN(Number(id));
    const rows = await db
      .select()
      .from(growthDiagnosisReports)
      .where(
        byNumericId
          ? eq(growthDiagnosisReports.id, Number(id))
          : eq(growthDiagnosisReports.reportId, id)
      )
      .limit(1);
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ message: "Report not found" }, { status: 404 });
    }

    if (format === "text") {
      const report = row.reportPayload as unknown as Parameters<typeof buildNarrativeParagraph>[0];
      const narrative = buildNarrativeParagraph(report);
      return new NextResponse(narrative, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="growth-diagnosis-${row.reportId}.txt"`,
        },
      });
    }

    return new NextResponse(JSON.stringify(row.reportPayload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="growth-diagnosis-${row.reportId}.json"`,
      },
    });
  } catch (e) {
    console.error("Export growth-diagnosis report:", e);
    return NextResponse.json(
      { message: "Failed to export report" },
      { status: 500 }
    );
  }
}
