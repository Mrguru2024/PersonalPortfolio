import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getSchedulerAppointmentDetailAdmin, updateAppointmentAdmin } from "@server/services/schedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const id = parseInt((await ctx.params).id, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const detail = await getSchedulerAppointmentDetailAdmin(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const id = parseInt((await ctx.params).id, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const patch: Parameters<typeof updateAppointmentAdmin>[1] = {};
  if (typeof body.status === "string") patch.status = body.status;
  if (body.internalNotes !== undefined) patch.internalNotes = body.internalNotes;
  if (body.guestCompany !== undefined) patch.guestCompany = body.guestCompany;
  if (body.leadScoreTier !== undefined) patch.leadScoreTier = body.leadScoreTier;
  if (body.intentClassification !== undefined) patch.intentClassification = body.intentClassification;
  if (body.noShowRiskTier !== undefined) patch.noShowRiskTier = body.noShowRiskTier;
  if (typeof body.paymentStatus === "string") patch.paymentStatus = body.paymentStatus;
  if (body.estimatedValueCents !== undefined) {
    patch.estimatedValueCents =
      body.estimatedValueCents === null ? null : parseInt(String(body.estimatedValueCents), 10);
  }
  if (body.completedAt !== undefined) {
    patch.completedAt =
      body.completedAt === null ? null : new Date(String(body.completedAt));
  }
  const result = await updateAppointmentAdmin(id, patch);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ appointment: result.row });
}
