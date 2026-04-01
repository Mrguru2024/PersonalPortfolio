import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listAmieReports } from "@server/services/amie/amieAnalysisService";

export const dynamic = "force-dynamic";

/** GET — saved AMIE reports (metadata). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? "30");
    const rows = await listAmieReports(Number.isFinite(limit) ? limit : 30);
    return NextResponse.json({ reports: rows });
  } catch (e) {
    console.error("AMIE reports list:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
