import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { importIntakeItemToCrm } from "@server/services/leadIntakeCrmService";
import type { LeadIntakeKind } from "@shared/leadIntakeTypes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const itemSchema = z.object({
  kind: z.enum(["growth_diagnosis", "funnel_lead", "assessment"]),
  id: z.number().int().positive(),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(25),
  useAi: z.boolean().optional(),
});

/**
 * POST /api/admin/lead-intake/import
 * Import selected submissions into CRM (merge by email). Optional AI classification when OPENAI_API_KEY is set.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid body", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { items, useAi } = parsed.data;
    if (useAi && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: "AI classification requested but OPENAI_API_KEY is not configured" },
        { status: 400 }
      );
    }

    const results = [];
    for (const it of items) {
      const r = await importIntakeItemToCrm(it.kind as LeadIntakeKind, it.id, { useAi: !!useAi });
      results.push(r);
    }

    return NextResponse.json({ results });
  } catch (e) {
    console.error("POST /api/admin/lead-intake/import:", e);
    return NextResponse.json({ message: "Import failed" }, { status: 500 });
  }
}
