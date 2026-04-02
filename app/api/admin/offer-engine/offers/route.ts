import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { offerTemplateWriteSchema } from "@shared/offerEngineTypes";
import { listOfferTemplates, createOfferTemplate } from "@server/services/offerEngineService";
import { buildOfferLeadMagnetIntelligenceSnapshot } from "@server/services/offerLeadMagnetIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function serializeOffer(row: Awaited<ReturnType<typeof listOfferTemplates>>[number]) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** GET /api/admin/offer-engine/offers */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const personaId = searchParams.get("personaId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const minScore = searchParams.get("minScore") ? Number(searchParams.get("minScore")) : undefined;
    const q = searchParams.get("q") ?? undefined;
    const includeIntelligence = searchParams.get("includeIntelligence") === "1";
    const rows = await listOfferTemplates({ personaId, status, minScore, q });
    if (!includeIntelligence) {
      return NextResponse.json({ offers: rows.map(serializeOffer) });
    }
    const snapshot = await buildOfferLeadMagnetIntelligenceSnapshot();
    const map = new Map(snapshot.offerRows.map((r) => [r.offerId, r]));
    return NextResponse.json({
      offers: rows.map((row) => ({
        ...serializeOffer(row),
        intelligence: map.get(row.id) ?? null,
      })),
    });
  } catch (e) {
    console.error("[GET offer-engine/offers]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** POST /api/admin/offer-engine/offers */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    const parsed = offerTemplateWriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const created = await createOfferTemplate(parsed.data);
    if (!created) {
      return NextResponse.json({ error: "Slug taken or persona missing" }, { status: 409 });
    }
    return NextResponse.json({ offer: serializeOffer(created) }, { status: 201 });
  } catch (e) {
    console.error("[POST offer-engine/offers]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
