/**
 * Joins stored funnel blueprint node paths to behavior_events rollups (admin-wide, not CRM-scoped).
 */
import { db } from "@server/db";
import { behaviorEvents } from "@shared/schema";
import { and, count, gte, sql } from "drizzle-orm";
import { getOrCreateFunnelBlueprint } from "./growthEngineStore";

export type FunnelBlueprintNodePublic = {
  id: string;
  type: string;
  label: string;
  path?: string;
};

function isBlueprintNodeJson(x: unknown): x is { id: string; type?: unknown; label?: unknown; path?: unknown } {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === "string";
}

function normPath(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  try {
    if (s.startsWith("http")) return new URL(s).pathname || s;
  } catch {
    /* ignore */
  }
  return s.split("?")[0] ?? s;
}

function pageExpr() {
  return sql<string>`nullif(trim(both from coalesce(${behaviorEvents.metadata}->>'page', '')), '')`;
}

export type FunnelStepMetric = FunnelBlueprintNodePublic & {
  pathNormalized: string;
  behaviorEvents: number;
  distinctSessions: number;
};

export async function buildFunnelBlueprintMetrics(blueprintKey: string, days: number): Promise<{
  blueprintKey: string;
  blueprintLabel: string;
  periodDays: number;
  sinceIso: string;
  steps: FunnelStepMetric[];
  totalBehaviorEventsInWindow: number;
}> {
  const periodDays = Math.min(365, Math.max(1, Math.floor(days)));
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();

  const blueprint = await getOrCreateFunnelBlueprint(blueprintKey);
  const rawNodes = blueprint.nodesJson as unknown[];
  const nodes: FunnelBlueprintNodePublic[] = rawNodes.filter(isBlueprintNodeJson).map((x) => ({
    id: x.id,
    type: typeof x.type === "string" ? x.type : "page",
    label: typeof x.label === "string" ? x.label : x.id,
    path: typeof x.path === "string" ? x.path : undefined,
  }));

  const pex = pageExpr();

  const [totalAgg] = await db
    .select({ c: count() })
    .from(behaviorEvents)
    .where(gte(behaviorEvents.timestamp, since));
  const totalBehaviorEventsInWindow = Number(totalAgg?.c ?? 0);

  const steps: FunnelStepMetric[] = [];
  for (const node of nodes) {
    const pathNorm = node.path ? normPath(node.path) : "";
    if (!pathNorm || !pathNorm.startsWith("/")) {
      steps.push({
        ...node,
        pathNormalized: pathNorm,
        behaviorEvents: 0,
        distinctSessions: 0,
      });
      continue;
    }

    const [row] = await db
      .select({
        ev: count(),
        sess: sql<number>`count(distinct ${behaviorEvents.sessionId})`.mapWith(Number),
      })
      .from(behaviorEvents)
      .where(and(gte(behaviorEvents.timestamp, since), sql`${pex} = ${pathNorm}`));

    steps.push({
      ...node,
      pathNormalized: pathNorm,
      behaviorEvents: Number(row?.ev ?? 0),
      distinctSessions: Number(row?.sess ?? 0),
    });
  }

  return {
    blueprintKey,
    blueprintLabel: blueprint.label,
    periodDays,
    sinceIso,
    steps,
    totalBehaviorEventsInWindow,
  };
}
