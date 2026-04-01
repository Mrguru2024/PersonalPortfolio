import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import {
  parseCrmLtvReportParamsFromSearchParams,
  formatCrmLtvReportAsCsv,
} from "@shared/crmLtvSnapshot";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/crm/ltv/report — parameterized LTV report (JSON or CSV).
 * Query: contactType, minEstimatedDollars, topContacts, topSources, dealView,
 * upliftPercent, imputeMissingLeadDollars, format=json|csv
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const params = parseCrmLtvReportParamsFromSearchParams(searchParams);
    const report = await storage.getCrmLtvReport(params);
    const format = (searchParams.get("format") ?? "json").toLowerCase();

    if (format === "csv") {
      const csv = formatCrmLtvReportAsCsv(report);
      const filename = `ltv-report-${report.reportMeta.generatedAt.slice(0, 10)}.csv`;
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error: unknown) {
    console.error("Error building CRM LTV report:", error);
    return NextResponse.json({ error: "Failed to build LTV report" }, { status: 500 });
  }
}
