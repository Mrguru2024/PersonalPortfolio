import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { createBookingTypeAdmin, listAllBookingTypesAdmin } from "@server/services/schedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const types = await listAllBookingTypesAdmin();
  return NextResponse.json({ types });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const result = await createBookingTypeAdmin({
    name: String(body.name ?? ""),
    slug: String(body.slug ?? ""),
    durationMinutes: Number(body.durationMinutes) || 30,
    description: body.description != null ? String(body.description) : null,
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    active: body.active !== false,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ type: result.row });
}
