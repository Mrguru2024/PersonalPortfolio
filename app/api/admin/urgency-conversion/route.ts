import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  getUrgencyAdminAnalyticsSnapshot,
  listUrgencySurfaces,
  upsertUrgencySurface,
  validateUrgencySurfaceSettings,
  type UrgencySurfaceWrite,
} from "@server/services/urgencyConversionService";
import {
  urgencyCapacitySources,
  urgencyCountDisplayModes,
  urgencyScarcityModes,
  urgencyUrgencyModes,
} from "@shared/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseModes(body: Record<string, unknown>): Pick<
  UrgencySurfaceWrite,
  "urgencyMode" | "scarcityMode" | "capacitySource" | "countDisplayMode"
> {
  const u = typeof body.urgencyMode === "string" ? body.urgencyMode : "none";
  const s = typeof body.scarcityMode === "string" ? body.scarcityMode : "none";
  const c = typeof body.capacitySource === "string" ? body.capacitySource : "none";
  const d = typeof body.countDisplayMode === "string" ? body.countDisplayMode : "exact";
  return {
    urgencyMode: urgencyUrgencyModes.includes(u as (typeof urgencyUrgencyModes)[number]) ? u as UrgencySurfaceWrite["urgencyMode"] : "none",
    scarcityMode: urgencyScarcityModes.includes(s as (typeof urgencyScarcityModes)[number])
      ? (s as UrgencySurfaceWrite["scarcityMode"])
      : "none",
    capacitySource: urgencyCapacitySources.includes(c as (typeof urgencyCapacitySources)[number])
      ? (c as UrgencySurfaceWrite["capacitySource"])
      : "none",
    countDisplayMode: urgencyCountDisplayModes.includes(d as (typeof urgencyCountDisplayModes)[number])
      ? (d as UrgencySurfaceWrite["countDisplayMode"])
      : "exact",
  };
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const rows = await listUrgencySurfaces();
    const { searchParams } = new URL(req.url);
    const analytics = searchParams.get("analytics") === "1";
    const tz = searchParams.get("tz")?.trim() || "America/New_York";
    const snapshots = analytics
      ? await Promise.all(rows.map((r) => getUrgencyAdminAnalyticsSnapshot(r.surfaceKey, tz)))
      : [];
    return NextResponse.json({
      surfaces: rows.map((r) => ({
        ...r,
        batchEndsAt: r.batchEndsAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      analyticsBySurface: analytics ? Object.fromEntries(rows.map((r, i) => [r.surfaceKey, snapshots[i]])) : undefined,
    });
  } catch (e) {
    console.error("[GET admin/urgency-conversion]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const surfaceKey = typeof body.surfaceKey === "string" ? body.surfaceKey.trim() : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    if (!surfaceKey || !displayName) {
      return NextResponse.json({ error: "surfaceKey and displayName required" }, { status: 400 });
    }

    const modes = parseModes(body);
    const batchRaw = typeof body.batchEndsAt === "string" ? body.batchEndsAt : null;
    const batchEndsAt = batchRaw ? new Date(batchRaw) : null;

    let rowId: number | undefined;
    if (typeof body.id === "number" && Number.isFinite(body.id) && body.id > 0) rowId = Math.trunc(body.id);
    else if (typeof body.id === "string" && body.id.trim()) {
      const n = parseInt(body.id, 10);
      if (Number.isFinite(n) && n > 0) rowId = n;
    }

    let scarcityEngineConfigId: number | null = null;
    const seRaw = body.scarcityEngineConfigId;
    if (seRaw != null && seRaw !== "") {
      const n = typeof seRaw === "number" ? seRaw : parseInt(String(seRaw), 10);
      if (Number.isFinite(n) && n > 0) scarcityEngineConfigId = n;
    }

    const input: UrgencySurfaceWrite = {
      id: rowId,
      surfaceKey,
      displayName,
      isActive: Boolean(body.isActive),
      ...modes,
      scarcityEngineConfigId,
      dailyCapacityMax:
        body.dailyCapacityMax != null && body.dailyCapacityMax !== ""
          ? Math.max(0, Math.trunc(Number(body.dailyCapacityMax)))
          : null,
      weeklyCapacityMax:
        body.weeklyCapacityMax != null && body.weeklyCapacityMax !== ""
          ? Math.max(0, Math.trunc(Number(body.weeklyCapacityMax)))
          : null,
      batchEndsAt: batchEndsAt && !Number.isNaN(batchEndsAt.getTime()) ? batchEndsAt : null,
      dailyWindowEndLocal: typeof body.dailyWindowEndLocal === "string" ? body.dailyWindowEndLocal : null,
      timezone: typeof body.timezone === "string" && body.timezone.trim() ? body.timezone.trim() : "America/New_York",
      prerequisiteSurfaceKey:
        typeof body.prerequisiteSurfaceKey === "string" ? body.prerequisiteSurfaceKey.trim() || null : null,
      earlyAccessLabel: typeof body.earlyAccessLabel === "string" ? body.earlyAccessLabel : null,
      qualificationFilterLabel: typeof body.qualificationFilterLabel === "string" ? body.qualificationFilterLabel : null,
      manualReviewLabel: typeof body.manualReviewLabel === "string" ? body.manualReviewLabel : null,
      proofTitle: typeof body.proofTitle === "string" ? body.proofTitle : null,
      proofBulletsJson: Array.isArray(body.proofBulletsJson)
        ? (body.proofBulletsJson as unknown[]).map((x) => String(x))
        : [],
      lossTitle: typeof body.lossTitle === "string" ? body.lossTitle : null,
      lossBulletsJson: Array.isArray(body.lossBulletsJson)
        ? (body.lossBulletsJson as unknown[]).map((x) => String(x))
        : [],
      defaultCtaVariantKey: typeof body.defaultCtaVariantKey === "string" ? body.defaultCtaVariantKey : "default",
      ctaVariantsJson: Array.isArray(body.ctaVariantsJson) ? (body.ctaVariantsJson as UrgencySurfaceWrite["ctaVariantsJson"]) : [],
      growthExperimentKey: typeof body.growthExperimentKey === "string" ? body.growthExperimentKey.trim() || null : null,
      funnelSlugForScarcity: typeof body.funnelSlugForScarcity === "string" ? body.funnelSlugForScarcity.trim() || null : null,
      offerSlugForScarcity: typeof body.offerSlugForScarcity === "string" ? body.offerSlugForScarcity.trim() || null : null,
      leadMagnetSlugForScarcity:
        typeof body.leadMagnetSlugForScarcity === "string" ? body.leadMagnetSlugForScarcity.trim() || null : null,
      analyticsEnabled: body.analyticsEnabled !== false,
    };

    const warnings = validateUrgencySurfaceSettings({
      ...input,
      surfaceKey: input.surfaceKey,
      batchEndsAt: input.batchEndsAt ?? undefined,
    });
    const saved = await upsertUrgencySurface(input);
    return NextResponse.json({
      surface: {
        ...saved,
        batchEndsAt: saved.batchEndsAt?.toISOString() ?? null,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      },
      warnings,
    });
  } catch (e) {
    console.error("[POST admin/urgency-conversion]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
