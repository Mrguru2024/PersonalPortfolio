import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listAppointmentsAdmin } from "@server/services/schedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const fromStr = req.nextUrl.searchParams.get("from");
  const toStr = req.nextUrl.searchParams.get("to");
  const from = fromStr ? new Date(fromStr) : undefined;
  const to = toStr ? new Date(toStr) : undefined;
  const rows =
    from && to && !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())
      ? await listAppointmentsAdmin({ from, to, limit: 200 })
      : await listAppointmentsAdmin({ limit: 100 });
  return NextResponse.json({ appointments: rows });
}
