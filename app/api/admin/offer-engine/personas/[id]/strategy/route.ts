import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { personaStrategyLayerSchema } from "@shared/offerEngineTypes";
import { updatePersonaStrategyLayer } from "@server/services/offerEngineService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** PATCH /api/admin/offer-engine/personas/[id]/strategy */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id } = await ctx.params;
    if (!id?.trim()) return NextResponse.json({ error: "Bad id" }, { status: 400 });
    const body = await req.json().catch(() => null);
    const parsed = personaStrategyLayerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const persona = await updatePersonaStrategyLayer(id.trim(), parsed.data);
    if (!persona) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ persona });
  } catch (e) {
    console.error("[PATCH offer-engine/personas/strategy]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
