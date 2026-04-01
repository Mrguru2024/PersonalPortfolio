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

async function serializeWithIntelligence(row: Awaited<ReturnType<typeof listLeadMagnetTemplates>>[number]) {
  const intelligence = await buildOfferLeadMagnetIntelligenceSnapshot({
    leadMagnetTemplateSlug: row.slug,
    relatedOfferTemplateId: row.relatedOfferTemplateId ?? undefined,
  });
  return {
    ...serialize(row),
    intelligence: intelligence.leadMagnets[0] ?? null,
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
    const leadMagnets = await Promise.all(rows.map((row) => serializeWithIntelligence(row)));
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
