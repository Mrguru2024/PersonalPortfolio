import { NextRequest, NextResponse } from "next/server";
import { cancelAppointmentByGuestToken } from "@server/services/schedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const r = await cancelAppointmentByGuestToken(token);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[public/scheduling/cancel]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
