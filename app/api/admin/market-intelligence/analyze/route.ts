import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { amieMarketBodySchema } from "@/lib/market-intelligence/requestSchema";
import { runAmieAnalysis, saveAmieAnalysis } from "@server/services/amie/amieAnalysisService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST — full AMIE run (Decision Intelligence Layer + integration hints). Optional persist. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const parsed = amieMarketBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;
    const input = {
      projectKey: body.projectKey,
      industry: body.industry,
      serviceType: body.serviceType,
      location: body.location,
      persona: body.persona,
    };

    const analysis = await runAmieAnalysis(input, { skipCache: body.skipCache });

    let researchId: number | undefined;
    if (body.save) {
      const user = await getSessionUser(req);
      const uid = user?.id != null ? Number(user.id) : null;
      researchId = await saveAmieAnalysis({
        createdByUserId: Number.isFinite(uid) ? uid : null,
        input,
        analysis,
      });
    }

    return NextResponse.json({
      ...analysis,
      savedResearchId: researchId ?? null,
    });
  } catch (e) {
    console.error("AMIE analyze:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
