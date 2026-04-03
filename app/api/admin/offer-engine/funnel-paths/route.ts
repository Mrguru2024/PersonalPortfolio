import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { funnelPathWriteSchema } from "@shared/offerEngineTypes";
import { listFunnelPaths, upsertFunnelPath } from "@server/services/offerEngineService";
import { getOfferEngineFunnelReadinessSignals } from "@server/services/offerEngineIntelligence";
import { evaluateScarcityForContext } from "@modules/scarcity-engine";

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
    const withInsights = searchParams.get("withInsights") === "1";
    if (!withInsights) return NextResponse.json({ funnelPaths: rows.map(serialize) });
    const alerts = await getOfferEngineFunnelReadinessSignals();
    return NextResponse.json({
      funnelPaths: rows.map(serialize),
      readiness: alerts,
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
    const scarcity = await evaluateScarcityForContext({
      personaId: row.personaId,
      funnelSlug: row.slug,
    }).catch(() => null);
    return NextResponse.json({ funnelPath: serialize(row), scarcity }, { status: 201 });
  } catch (e) {
    console.error("[POST offer-engine/funnel-paths]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
