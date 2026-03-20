import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listPublishLogs } from "@server/services/internalStudio/workflowService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const logs = await listPublishLogs({
      documentId: searchParams.get("documentId")
        ? parseInt(searchParams.get("documentId")!, 10)
        : undefined,
      limit: parseInt(searchParams.get("limit") ?? "50", 10) || 50,
    });
    return NextResponse.json({ logs });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
