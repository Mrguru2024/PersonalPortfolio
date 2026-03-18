import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { growthDiagnosisReports } from "@shared/schema";
import { desc, eq, like, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/growth-diagnosis/reports
 * List persisted diagnosis reports (admin only). Query: limit (default 50), email, url.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const email = searchParams.get("email")?.trim() || undefined;
    const urlFilter = searchParams.get("url")?.trim() || undefined;

    const conditions = [];
    if (email) conditions.push(eq(growthDiagnosisReports.email, email));
    if (urlFilter) conditions.push(like(growthDiagnosisReports.url, `%${urlFilter}%`));

    const selection = {
      id: growthDiagnosisReports.id,
      reportId: growthDiagnosisReports.reportId,
      url: growthDiagnosisReports.url,
      email: growthDiagnosisReports.email,
      businessType: growthDiagnosisReports.businessType,
      primaryGoal: growthDiagnosisReports.primaryGoal,
      status: growthDiagnosisReports.status,
      pagesAnalyzed: growthDiagnosisReports.pagesAnalyzed,
      overallScore: growthDiagnosisReports.overallScore,
      createdAt: growthDiagnosisReports.createdAt,
    };
    const rows =
      conditions.length > 0
        ? await db
            .select(selection)
            .from(growthDiagnosisReports)
            .where(and(...conditions))
            .orderBy(desc(growthDiagnosisReports.createdAt))
            .limit(limit)
        : await db
            .select(selection)
            .from(growthDiagnosisReports)
            .orderBy(desc(growthDiagnosisReports.createdAt))
            .limit(limit);
    return NextResponse.json({ reports: rows });
  } catch (e) {
    console.error("GET admin growth-diagnosis reports:", e);
    return NextResponse.json(
      { message: "Failed to load reports" },
      { status: 500 }
    );
  }
}
