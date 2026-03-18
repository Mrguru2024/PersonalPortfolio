import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { growthDiagnosisReports } from "@shared/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/growth-diagnosis/reports/[id]
 * Get full report by numeric id or reportId (admin only). Returns full reportPayload + diagnostics.
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
    const report = row.reportPayload as Record<string, unknown>;
    const issues = (report?.issues as Array<{ verificationStatus?: string }>) ?? [];
    const verified = issues.filter((i) => i.verificationStatus === "verified").length;
    const partial = issues.filter((i) => i.verificationStatus === "partial").length;
    const lowConfidence = issues.filter((i) => i.verificationStatus === "low_confidence").length;
    return NextResponse.json({
      report: row.reportPayload,
      request: row.requestPayload,
      diagnostics: {
        verification: { verified, partial, lowConfidence, total: issues.length },
        reportId: row.reportId,
        pagesAnalyzed: row.pagesAnalyzed,
        overallScore: row.overallScore,
      },
    });
  } catch (e) {
    console.error("GET admin growth-diagnosis report:", e);
    return NextResponse.json(
      { message: "Failed to load report" },
      { status: 500 }
    );
  }
}
