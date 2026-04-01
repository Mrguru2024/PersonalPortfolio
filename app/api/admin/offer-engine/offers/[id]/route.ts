import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { offerTemplateWriteSchema } from "@shared/offerEngineTypes";
import {
  getOfferTemplate,
  updateOfferTemplate,
  deleteOfferTemplate,
} from "@server/services/offerEngineService";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const idParam = z.coerce.number().int().positive();

function serialize(row: NonNullable<Awaited<ReturnType<typeof getOfferTemplate>>>) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** GET /api/admin/offer-engine/offers/[id] */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id: raw } = await ctx.params;
    const id = idParam.safeParse(raw);
    if (!id.success) return NextResponse.json({ error: "Bad id" }, { status: 400 });
    const row = await getOfferTemplate(id.data);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ offer: serialize(row) });
  } catch (e) {
    console.error("[GET offer-engine/offers/id]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** PATCH /api/admin/offer-engine/offers/[id] */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id: raw } = await ctx.params;
    const id = idParam.safeParse(raw);
    if (!id.success) return NextResponse.json({ error: "Bad id" }, { status: 400 });
    const body = await req.json().catch(() => null);
    const partial = offerTemplateWriteSchema.partial().safeParse(body);
    if (!partial.success) {
      return NextResponse.json({ error: "Invalid body", details: partial.error.flatten() }, { status: 400 });
    }
    const updated = await updateOfferTemplate(id.data, partial.data);
    if (!updated) return NextResponse.json({ error: "Not found or invalid persona" }, { status: 404 });
    return NextResponse.json({ offer: serialize(updated) });
  } catch (e) {
    console.error("[PATCH offer-engine/offers/id]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** DELETE /api/admin/offer-engine/offers/[id] */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id: raw } = await ctx.params;
    const id = idParam.safeParse(raw);
    if (!id.success) return NextResponse.json({ error: "Bad id" }, { status: 400 });
    const ok = await deleteOfferTemplate(id.data);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE offer-engine/offers/id]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
