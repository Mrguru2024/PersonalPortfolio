import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { getMarketingPersona, updateMarketingPersona } from "@server/services/ascendraIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z
  .object({
    displayName: z.string().min(1).optional(),
    segment: z.string().nullable().optional(),
    revenueBand: z.string().nullable().optional(),
    summary: z.string().nullable().optional(),
    strategicNote: z.string().nullable().optional(),
    problems: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional(),
    objections: z.array(z.string()).optional(),
    dynamicSignals: z.array(z.string()).optional(),
  })
  .strict();

/** GET /api/admin/ascendra-intelligence/personas/[id] */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id } = await params;
    const persona = await getMarketingPersona(id);
    if (!persona) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ persona });
  } catch (e) {
    console.error("[GET ascendra-intelligence/personas/id]", e);
    return NextResponse.json({ error: "Failed to load persona" }, { status: 500 });
  }
}

/** PATCH /api/admin/ascendra-intelligence/personas/[id] */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const persona = await updateMarketingPersona(id, parsed.data);
    if (!persona) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ persona });
  } catch (e) {
    console.error("[PATCH ascendra-intelligence/personas/id]", e);
    return NextResponse.json({ error: "Failed to update persona" }, { status: 500 });
  }
}
