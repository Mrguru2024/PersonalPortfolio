import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { duplicateLeadMagnetTemplate } from "@server/services/offerEngineService";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const idParam = z.coerce.number().int().positive();

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id: raw } = await ctx.params;
    const id = idParam.safeParse(raw);
    if (!id.success) return NextResponse.json({ error: "Bad id" }, { status: 400 });
    const dup = await duplicateLeadMagnetTemplate(id.data);
    if (!dup) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      leadMagnet: { ...dup, createdAt: dup.createdAt.toISOString(), updatedAt: dup.updatedAt.toISOString() },
    });
  } catch (e) {
    console.error("[POST offer-engine/lm/duplicate]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
