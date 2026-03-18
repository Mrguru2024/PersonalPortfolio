import { NextRequest, NextResponse } from "next/server";
import { ASC_VISITOR_COOKIE } from "@/lib/analytics/attribution";
import { assignExperiments } from "@/lib/experiments/assignment";
import {
  EXPERIMENT_CATALOG,
  isExperimentKey,
  type ExperimentKey,
} from "@/lib/experiments/catalog";
import { getPosthogFeatureFlagVariant } from "@server/services/analytics/posthogServer";

export const dynamic = "force-dynamic";

function sanitizeVisitorId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 128);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedKeys = Array.isArray(body?.keys)
      ? body.keys.map((key: unknown) => String(key))
      : [];

    const validKeys = (requestedKeys.length ? requestedKeys : Object.keys(EXPERIMENT_CATALOG))
      .filter(isExperimentKey)
      .slice(0, 20) as ExperimentKey[];

    if (!validKeys.length) {
      return NextResponse.json({ message: "No valid experiment keys provided" }, { status: 400 });
    }

    const distinctId =
      sanitizeVisitorId(body?.visitorId) ||
      sanitizeVisitorId(req.cookies.get(ASC_VISITOR_COOKIE)?.value) ||
      `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const assignments = assignExperiments(validKeys, distinctId);
    for (const key of validKeys) {
      const definition = EXPERIMENT_CATALOG[key];
      const posthogVariant = await getPosthogFeatureFlagVariant(key, distinctId);
      if (typeof posthogVariant !== "string") continue;
      if (!definition.variants.includes(posthogVariant)) continue;
      assignments[key] = {
        key,
        variant: posthogVariant,
        source: "posthog",
      };
    }
    return NextResponse.json({
      ok: true,
      distinctId,
      assignments,
    });
  } catch (error) {
    console.error("POST /api/experiments/assignments failed:", error);
    return NextResponse.json(
      { message: "Failed to assign experiments" },
      { status: 500 }
    );
  }
}
