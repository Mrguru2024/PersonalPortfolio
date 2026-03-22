import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { deleteAvailabilityRuleAdmin, updateAvailabilityRuleAdmin } from "@server/services/schedulingService";

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
  let bookingTypeId: number | null | undefined;
  if (body.bookingTypeId !== undefined) {
    if (body.bookingTypeId === null || body.bookingTypeId === "null") bookingTypeId = null;
    else {
      const n = typeof body.bookingTypeId === "number" ? body.bookingTypeId : parseInt(String(body.bookingTypeId), 10);
      bookingTypeId = Number.isFinite(n) ? n : undefined;
    }
  }
  const result = await updateAvailabilityRuleAdmin(id, {
    bookingTypeId,
    dayOfWeek: typeof body.dayOfWeek === "number" ? body.dayOfWeek : undefined,
    startTimeLocal: typeof body.startTimeLocal === "string" ? body.startTimeLocal : undefined,
    endTimeLocal: typeof body.endTimeLocal === "string" ? body.endTimeLocal : undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { id: idStr } = await ctx.params;
  const id = parseId({ id: idStr });
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  await deleteAvailabilityRuleAdmin(id);
  return NextResponse.json({ ok: true });
}
