import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { amieMarketBodySchema } from "@/lib/market-intelligence/requestSchema";
import { runAmieAnalysis, pickAmieDimension } from "@server/services/amie/amieAnalysisService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DIMENSIONS = new Set([
  "demand",
  "competition",
  "purchase-power",
  "pain",
  "targeting-difficulty",
  "trend",
  "pricing",
  "opportunity",
]);

type Dimension = Parameters<typeof pickAmieDimension>[1];

/** POST — modular slice (demand, competition, …) sharing the same cache/scoring pipeline. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dimension: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const dimensionRaw = (await params).dimension;
    if (!DIMENSIONS.has(dimensionRaw)) {
      return NextResponse.json({ error: "Unknown dimension" }, { status: 404 });
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

    const full = await runAmieAnalysis(input, { skipCache: body.skipCache });
    const slice = pickAmieDimension(full, dimensionRaw as Dimension);
    return NextResponse.json({ dimension: dimensionRaw, input, data: slice });
  } catch (e) {
    console.error("AMIE dimension:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
