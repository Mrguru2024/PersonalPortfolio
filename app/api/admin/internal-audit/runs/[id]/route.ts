import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getAuditRunById, filterAuditDetail } from "@server/services/internalStudio/auditService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const runId = parseInt(id, 10);
    if (Number.isNaN(runId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const detail = await getAuditRunById(runId);
    if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const filtered = filterAuditDetail(detail, {
      categoryKey: searchParams.get("categoryKey") ?? undefined,
      pathSubstring: searchParams.get("path") ?? undefined,
    });
    return NextResponse.json(filtered);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
