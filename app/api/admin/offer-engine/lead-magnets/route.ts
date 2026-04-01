import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { leadMagnetTemplateWriteSchema } from "@shared/offerEngineTypes";
import { listLeadMagnetTemplates, createLeadMagnetTemplate } from "@server/services/offerEngineService";
import { buildOfferLeadMagnetIntelligenceSnapshot } from "@server/services/offerLeadMagnetIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function serialize(row: Awaited<ReturnType<typeof listLeadMagnetTemplates>>[number]) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function summarizeIntelligence(intel: {
  optIns: number;
  leadQualityRate: number;
  warnings: string[];
} | null) {
  if (!intel) return null;
  const trafficFitLabel =
    intel.optIns >= 8 && intel.leadQualityRate < 12
      ? "High volume / low intent"
      : intel.optIns >= 3 && intel.leadQualityRate >= 20
        ? "High intent"
        : "Needs data";
  const handoffRiskLabel = intel.warnings.length > 0 ? "Handoff risk" : "Aligned";
  return {
    trafficFitLabel,
    handoffRiskLabel,
    warnings: intel.warnings,
    optIns: intel.optIns,
    leadQualityRate: intel.leadQualityRate,
  };
}

function serializeWithIntelligence(
  row: Awaited<ReturnType<typeof listLeadMagnetTemplates>>[number],
  bySlug: Map<string, { optIns: number; leadQualityRate: number; warnings: string[] }>,
) {
  const intelligence = summarizeIntelligence(bySlug.get(row.slug) ?? null);
  return {
    ...serialize(row),
    intelligence,
  };
}

/** GET /api/admin/offer-engine/lead-magnets */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const rows = await listLeadMagnetTemplates({
      personaId: searchParams.get("personaId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      minScore: searchParams.get("minScore") ? Number(searchParams.get("minScore")) : undefined,
      q: searchParams.get("q") ?? undefined,
    });
    let intelligenceBySlug = new Map<
      string,
      { optIns: number; leadQualityRate: number; warnings: string[] }
    >();
    try {
      const snapshot = await buildOfferLeadMagnetIntelligenceSnapshot();
      intelligenceBySlug = new Map(
        snapshot.leadMagnetRows.map((row) => [
          row.leadMagnetSlug,
          {
            optIns: row.optIns,
            leadQualityRate: row.leadQualityRate,
            warnings: row.warnings,
          },
        ]),
      );
    } catch (intelError) {
      // Intelligence should not block primary list rendering.
      console.warn("[GET offer-engine/lead-magnets] intelligence unavailable", intelError);
    }

    const leadMagnets = rows.map((row) => serializeWithIntelligence(row, intelligenceBySlug));
    return NextResponse.json({ leadMagnets });
  } catch (e) {
    console.error("[GET offer-engine/lead-magnets]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** POST /api/admin/offer-engine/lead-magnets */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    const parsed = leadMagnetTemplateWriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const created = await createLeadMagnetTemplate(parsed.data);
    if (!created) {
      return NextResponse.json({ error: "Slug taken, persona missing, or offer id invalid" }, { status: 409 });
    }
    return NextResponse.json({ leadMagnet: serialize(created) }, { status: 201 });
  } catch (e) {
    console.error("[POST offer-engine/lead-magnets]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
