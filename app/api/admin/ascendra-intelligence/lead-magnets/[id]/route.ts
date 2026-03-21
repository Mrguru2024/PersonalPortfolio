import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import {
  deleteLeadMagnet,
  getLeadMagnet,
  updateLeadMagnet,
} from "@server/services/ascendraIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const magnetTypeZ = z.enum(["reveal_problems", "sample_trial", "one_step_system"]);

const patchSchema = z
  .object({
    magnetType: magnetTypeZ.optional(),
    title: z.string().min(1).optional(),
    hook: z.string().nullable().optional(),
    bodyMd: z.string().nullable().optional(),
    primaryAssetId: z.number().int().positive().nullable().optional(),
    personaIds: z.array(z.string()).optional(),
    status: z.enum(["draft", "approved", "published"]).optional(),
  })
  .strict();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const id = Number.parseInt((await params).id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const magnet = await getLeadMagnet(id);
    if (!magnet) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ magnet });
  } catch (e) {
    console.error("[GET ascendra-intelligence/lead-magnets/id]", e);
    return NextResponse.json({ error: "Failed to load lead magnet" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const id = Number.parseInt((await params).id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const magnet = await updateLeadMagnet(id, parsed.data);
    if (!magnet) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ magnet });
  } catch (e) {
    console.error("[PATCH ascendra-intelligence/lead-magnets/id]", e);
    return NextResponse.json({ error: "Failed to update lead magnet" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const id = Number.parseInt((await params).id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const ok = await deleteLeadMagnet(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE ascendra-intelligence/lead-magnets/id]", e);
    return NextResponse.json({ error: "Failed to delete lead magnet" }, { status: 500 });
  }
}
