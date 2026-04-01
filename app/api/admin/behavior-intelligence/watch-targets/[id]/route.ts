import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { deleteWatchTarget, updateWatchTarget } from "@server/services/behavior/behaviorWatchService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchBody = z.object({
  name: z.string().min(1).max(256).optional(),
  scopeType: z.enum(["path_prefix", "full_url", "aos_agency_project"]).optional(),
  pathPattern: z.string().min(1).max(2048).optional(),
  fullUrlPrefix: z.union([z.string().max(2048), z.null()]).optional(),
  aosAgencyProjectId: z.number().int().positive().nullable().optional(),
  metadataJson: z.record(z.unknown()).nullable().optional(),
  businessId: z.string().max(128).nullable().optional(),
  active: z.boolean().optional(),
  recordReplay: z.boolean().optional(),
  recordHeatmap: z.boolean().optional(),
  maxSessionRecordingMinutes: z.number().int().min(1).max(240).nullable().optional(),
  collectFrom: z.string().min(4).nullable().optional(),
  collectUntil: z.string().min(4).nullable().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const id = Number((await ctx.params).id);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const raw = await req.json().catch(() => null);
  const parsed = patchBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;
  const row = await updateWatchTarget(id, {
    ...(b.name !== undefined ? { name: b.name } : {}),
    ...(b.scopeType !== undefined ? { scopeType: b.scopeType } : {}),
    ...(b.pathPattern !== undefined ? { pathPattern: b.pathPattern } : {}),
    ...(b.fullUrlPrefix !== undefined ? { fullUrlPrefix: b.fullUrlPrefix } : {}),
    ...(b.aosAgencyProjectId !== undefined ? { aosAgencyProjectId: b.aosAgencyProjectId } : {}),
    ...(b.metadataJson !== undefined ? { metadataJson: b.metadataJson } : {}),
    ...(b.businessId !== undefined ? { businessId: b.businessId } : {}),
    ...(b.active !== undefined ? { active: b.active } : {}),
    ...(b.recordReplay !== undefined ? { recordReplay: b.recordReplay } : {}),
    ...(b.recordHeatmap !== undefined ? { recordHeatmap: b.recordHeatmap } : {}),
    ...(b.maxSessionRecordingMinutes !== undefined ? { maxSessionRecordingMinutes: b.maxSessionRecordingMinutes } : {}),
    ...(b.collectFrom !== undefined ? { collectFrom: b.collectFrom ? new Date(b.collectFrom) : null } : {}),
    ...(b.collectUntil !== undefined ? { collectUntil: b.collectUntil ? new Date(b.collectUntil) : null } : {}),
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ target: row });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const id = Number((await ctx.params).id);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const ok = await deleteWatchTarget(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
