import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { funnelPathWriteSchema } from "@shared/offerEngineTypes";
import { listFunnelPaths, upsertFunnelPath } from "@server/services/offerEngineService";
import { buildOfferLeadMagnetIntelligenceSnapshot } from "@server/services/offerLeadMagnetIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function serialize(row: Awaited<ReturnType<typeof listFunnelPaths>>[number]) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** GET /api/admin/offer-engine/funnel-paths */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const personaId = searchParams.get("personaId") ?? undefined;
    const rows = await listFunnelPaths(personaId);
    const intelligence = await buildOfferLeadMagnetIntelligenceSnapshot(personaId ?? undefined);
    return NextResponse.json({
      funnelPaths: rows.map(serialize),
      intelligence,
    });
  } catch (e) {
    console.error("[GET offer-engine/funnel-paths]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** POST /api/admin/offer-engine/funnel-paths — upsert by slug */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    const parsed = funnelPathWriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const row = await upsertFunnelPath(parsed.data);
    if (!row) return NextResponse.json({ error: "Invalid persona or template refs" }, { status: 400 });
    return NextResponse.json({ funnelPath: serialize(row) }, { status: 201 });
  } catch (e) {
    console.error("[POST offer-engine/funnel-paths]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
