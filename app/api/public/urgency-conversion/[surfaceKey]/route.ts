import { NextRequest, NextResponse } from "next/server";
import {
  getUrgencySurfaceByKey,
  resolvePublicUrgencyPayload,
} from "@server/services/urgencyConversionService";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ surfaceKey: string }> },
) {
  try {
    const { surfaceKey: raw } = await ctx.params;
    const surfaceKey = decodeURIComponent(raw || "").trim();
    if (!surfaceKey) {
      return NextResponse.json({ error: "Missing surface" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const visitorId = searchParams.get("visitorId")?.trim();
    const sessionId = searchParams.get("sessionId")?.trim();

    let experimentVariantKey: string | null = null;
    const row = await getUrgencySurfaceByKey(surfaceKey);
    if (row?.growthExperimentKey && visitorId) {
      const v = await storage.getOrAssignVariant(row.growthExperimentKey, visitorId, sessionId ?? null);
      experimentVariantKey = v?.variantKey ?? null;
    }

    const payload = await resolvePublicUrgencyPayload(surfaceKey, { experimentVariantKey });
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[GET public/urgency-conversion]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
