import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { deleteBookingTypeAdmin, updateBookingTypeAdmin } from "@server/services/schedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseId(params: { id: string }): number | null {
  const n = parseInt(params.id, 10);
  return Number.isFinite(n) ? n : null;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { id: idStr } = await ctx.params;
  const id = parseId({ id: idStr });
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const result = await updateBookingTypeAdmin(id, {
    name: typeof body.name === "string" ? body.name : undefined,
    slug: typeof body.slug === "string" ? body.slug : undefined,
    durationMinutes: typeof body.durationMinutes === "number" ? body.durationMinutes : undefined,
    description: body.description !== undefined ? (body.description === null ? null : String(body.description)) : undefined,
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
    active: typeof body.active === "boolean" ? body.active : undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ type: result.row });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { id: idStr } = await ctx.params;
  const id = parseId({ id: idStr });
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const result = await deleteBookingTypeAdmin(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
