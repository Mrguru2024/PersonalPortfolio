import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  getScarcityBlockedCampaignSummaries,
  getFunnelScarcityReadinessSignals,
  listScarcityConfigs,
  upsertScarcityConfig,
} from "@modules/scarcity-engine";
import { scarcityConfigTypes } from "@shared/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
}

function toInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }
  return fallback;
}

function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text : null;
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const [configs, readiness, blockedCampaigns] = await Promise.all([
      listScarcityConfigs(),
      getFunnelScarcityReadinessSignals(),
      getScarcityBlockedCampaignSummaries(),
    ]);
    return NextResponse.json({
      configs: configs.map((cfg) => ({
        ...cfg,
        cycleStartDate: cfg.cycleStartDate?.toISOString() ?? null,
        createdAt: cfg.createdAt.toISOString(),
        updatedAt: cfg.updatedAt.toISOString(),
      })),
      readiness,
      blockedCampaigns,
    });
  } catch (error) {
    console.error("[GET admin/scarcity-engine]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const typeInput = typeof body.type === "string" ? body.type : "capacity";
    const type = scarcityConfigTypes.includes(typeInput as (typeof scarcityConfigTypes)[number])
      ? (typeInput as (typeof scarcityConfigTypes)[number])
      : "capacity";
    const name = toText(body.name);
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const cycleStartRaw = toText(body.cycleStartDate);
    const cycleStartDate = cycleStartRaw ? new Date(cycleStartRaw) : null;
    const saved = await upsertScarcityConfig({
      id: toInt(body.id, 0) || undefined,
      name,
      type,
      maxSlots: toInt(body.maxSlots, 0),
      waitlistEnabled: toBool(body.waitlistEnabled, true),
      cycleDurationDays: Math.max(1, toInt(body.cycleDurationDays, 30)),
      cycleStartDate:
        cycleStartDate && !Number.isNaN(cycleStartDate.getTime()) ? cycleStartDate : null,
      personaLimit: toText(body.personaLimit),
      offerLimit: toText(body.offerLimit),
      leadMagnetLimit: toText(body.leadMagnetLimit),
      funnelLimit: toText(body.funnelLimit),
      qualificationThreshold: Math.max(0, Math.min(100, toInt(body.qualificationThreshold, 60))),
      performanceThresholdsJson:
        body.performanceThresholdsJson && typeof body.performanceThresholdsJson === "object"
          ? (body.performanceThresholdsJson as { conversionRateMin?: number; leadQualityMin?: number; revenueCentsMin?: number })
          : {},
      isActive: toBool(body.isActive, true),
    });
    return NextResponse.json({
      config: {
        ...saved,
        cycleStartDate: saved.cycleStartDate?.toISOString() ?? null,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[POST admin/scarcity-engine]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
