import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { duplicateCalendarEntry } from "@server/services/internalStudio/calendarService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const eid = parseInt(id, 10);
    if (Number.isNaN(eid)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const row = await duplicateCalendarEntry(eid);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ entry: row });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
