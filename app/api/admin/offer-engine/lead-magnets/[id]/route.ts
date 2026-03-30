import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { leadMagnetTemplateWriteSchema } from "@shared/offerEngineTypes";
import {
  getLeadMagnetTemplate,
  updateLeadMagnetTemplate,
  deleteLeadMagnetTemplate,
} from "@server/services/offerEngineService";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const idParam = z.coerce.number().int().positive();

function serialize(row: NonNullable<Awaited<ReturnType<typeof getLeadMagnetTemplate>>>) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id: raw } = await ctx.params;
    const id = idParam.safeParse(raw);
    if (!id.success) return NextResponse.json({ error: "Bad id" }, { status: 400 });
    const row = await getLeadMagnetTemplate(id.data);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ leadMagnet: serialize(row) });
  } catch (e) {
    console.error("[GET offer-engine/lead-magnets/id]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id: raw } = await ctx.params;
    const id = idParam.safeParse(raw);
    if (!id.success) return NextResponse.json({ error: "Bad id" }, { status: 400 });
    const body = await req.json().catch(() => null);
    const partial = leadMagnetTemplateWriteSchema.partial().safeParse(body);
    if (!partial.success) {
      return NextResponse.json({ error: "Invalid body", details: partial.error.flatten() }, { status: 400 });
    }
    const updated = await updateLeadMagnetTemplate(id.data, partial.data);
    if (!updated) return NextResponse.json({ error: "Not found or invalid refs" }, { status: 404 });
    return NextResponse.json({ leadMagnet: serialize(updated) });
  } catch (e) {
    console.error("[PATCH offer-engine/lead-magnets/id]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id: raw } = await ctx.params;
    const id = idParam.safeParse(raw);
    if (!id.success) return NextResponse.json({ error: "Bad id" }, { status: 400 });
    const ok = await deleteLeadMagnetTemplate(id.data);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE offer-engine/lead-magnets/id]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
