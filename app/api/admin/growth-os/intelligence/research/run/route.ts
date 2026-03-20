import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { runResearchDiscovery } from "@server/services/growthIntelligence/researchIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  projectKey: z.string().default("ascendra_main"),
  seed: z.string().min(1).max(2000),
  focus: z.enum(["keyword", "topic", "phrase", "headline", "mixed"]).optional(),
  label: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await getSessionUser(req);
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const out = await runResearchDiscovery({
      projectKey: parsed.data.projectKey,
      seed: parsed.data.seed,
      focus: parsed.data.focus,
      label: parsed.data.label,
      createdByUserId: user?.id ?? null,
    });
    return NextResponse.json(out);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
