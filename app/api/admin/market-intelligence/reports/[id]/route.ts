import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getAmieReportById } from "@server/services/amie/amieAnalysisService";

export const dynamic = "force-dynamic";

/** GET — single persisted AMIE report (research + data + strategy). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(_req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const row = await getAmieReportById(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error("AMIE report GET:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
