import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listPlatformAdaptersForCalendar } from "@server/services/internalStudio/workflowService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const adapters = await listPlatformAdaptersForCalendar();
    return NextResponse.json({ adapters });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
