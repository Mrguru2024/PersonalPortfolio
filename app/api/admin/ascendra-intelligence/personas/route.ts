import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { createMarketingPersona, listMarketingPersonas } from "@server/services/ascendraIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const personaIdZ = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Use lowercase slug (letters, numbers, hyphens)");

const postSchema = z
  .object({
    id: personaIdZ,
    displayName: z.string().min(1).max(200),
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

/** GET /api/admin/ascendra-intelligence/personas */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const personas = await listMarketingPersonas();
    return NextResponse.json({ personas });
  } catch (e) {
    console.error("[GET ascendra-intelligence/personas]", e);
    return NextResponse.json({ error: "Failed to list personas" }, { status: 500 });
  }
}

/** POST /api/admin/ascendra-intelligence/personas */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    // Option A: Zod `.nullable()` yields `null`; Drizzle-friendly optionals use `undefined` at the boundary.
    const d = parsed.data;
    const persona = await createMarketingPersona({
      id: d.id,
      displayName: d.displayName,
      segment: d.segment ?? undefined,
      revenueBand: d.revenueBand ?? undefined,
      summary: d.summary ?? undefined,
      strategicNote: d.strategicNote ?? undefined,
      problems: d.problems,
      goals: d.goals,
      objections: d.objections,
      dynamicSignals: d.dynamicSignals,
    });
    if (!persona) {
      return NextResponse.json(
        { error: "Persona id already exists or invalid" },
        { status: 409 },
      );
    }
    return NextResponse.json({ persona }, { status: 201 });
  } catch (e) {
    console.error("[POST ascendra-intelligence/personas]", e);
    return NextResponse.json({ error: "Failed to create persona" }, { status: 500 });
  }
}
