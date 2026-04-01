import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  deleteTrackedNumber,
  updateTrackedNumber,
} from "@server/services/behavior/behaviorPhoneTrackingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  try {
    const patch: Parameters<typeof updateTrackedNumber>[1] = {};
    if (typeof body.phoneE164 === "string") patch.phoneE164 = body.phoneE164;
    if (typeof body.label === "string") patch.label = body.label;
    if (typeof body.provider === "string") patch.provider = body.provider;
    if (typeof body.recordingEnabled === "boolean") patch.recordingEnabled = body.recordingEnabled;
    if (typeof body.active === "boolean") patch.active = body.active;
    if (body.businessId === null || typeof body.businessId === "string") {
      patch.businessId = body.businessId;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }
    const row = await updateTrackedNumber(id, patch);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ok = await deleteTrackedNumber(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
