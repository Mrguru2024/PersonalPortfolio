/**
 * Evidence-only insight and recommendation helpers for AEE.
 * No generative claims — comparisons use stored metrics + simple thresholds.
 */
import { db } from "@server/db";
import { and, eq, sql } from "drizzle-orm";
import { aeeExperimentMetricsDaily, growthVariants } from "@shared/schema";

export type VariantMetricRollup = {
  variantId: number;
  variantKey: string;
  variantName: string;
  visitors: number;
  leads: number;
  revenueCents: number;
  costCents: number;
  ctr: number | null;
  convRate: number | null;
};

export async function rollupVariantMetrics(
  experimentId: number,
  workspaceKey = "ascendra_main",
): Promise<VariantMetricRollup[]> {
  const variantMeta = await db
    .select({
      id: growthVariants.id,
      key: growthVariants.key,
      name: growthVariants.name,
    })
    .from(growthVariants)
    .where(eq(growthVariants.experimentId, experimentId));

  if (!variantMeta.length) return [];

  const totals = await db
    .select({
      variantId: aeeExperimentMetricsDaily.variantId,
      visitors: sql<number>`coalesce(sum(${aeeExperimentMetricsDaily.visitors}), 0)::int`,
      leads: sql<number>`coalesce(sum(${aeeExperimentMetricsDaily.leads}), 0)::int`,
      revenueCents: sql<number>`coalesce(sum(${aeeExperimentMetricsDaily.revenueCents}), 0)::int`,
      costCents: sql<number>`coalesce(sum(${aeeExperimentMetricsDaily.costCents}), 0)::int`,
      impressions: sql<number>`coalesce(sum(${aeeExperimentMetricsDaily.impressions}), 0)::int`,
      clicks: sql<number>`coalesce(sum(${aeeExperimentMetricsDaily.clicks}), 0)::int`,
    })
    .from(aeeExperimentMetricsDaily)
    .where(
      and(
        eq(aeeExperimentMetricsDaily.experimentId, experimentId),
        eq(aeeExperimentMetricsDaily.workspaceKey, workspaceKey),
        eq(aeeExperimentMetricsDaily.dimensionKey, "total"),
      ),
    )
    .groupBy(aeeExperimentMetricsDaily.variantId);

  const byVid = new Map(totals.map((t) => [t.variantId, t]));
  return variantMeta.map((v) => {
    const t = byVid.get(v.id);
    const visitors = t ? Number(t.visitors) : 0;
    const leads = t ? Number(t.leads) : 0;
    const impressions = t ? Number(t.impressions) : 0;
    const clicks = t ? Number(t.clicks) : 0;
    const ctr = impressions > 0 ? clicks / impressions : null;
    const convRate = visitors > 0 ? leads / visitors : null;
    return {
      variantId: v.id,
      variantKey: v.key,
      variantName: v.name,
      visitors,
      leads,
      revenueCents: t ? Number(t.revenueCents) : 0,
      costCents: t ? Number(t.costCents) : 0,
      ctr,
      convRate,
    };
  });
}

export type AeeRecommendation = {
  kind: "promote_winner" | "pause_underperformer" | "needs_data" | "budget_shift" | "quality_watch";
  title: string;
  detail: string;
  evidence: Record<string, unknown>;
};

/**
 * Build conservative recommendations from rollups (min sample heuristic).
 */
export function recommendationsFromRollups(rollups: VariantMetricRollup[]): AeeRecommendation[] {
  const out: AeeRecommendation[] = [];
  const withData = rollups.filter((r) => r.visitors >= 20 || r.leads >= 1);
  if (!rollups.length) return out;
  if (!withData.length) {
    out.push({
      kind: "needs_data",
      title: "Not enough traffic yet",
      detail: "Wait for at least ~20 visitors or first lead per variant before calling winners.",
      evidence: { thresholdVisitors: 20, variants: rollups.map((r) => ({ key: r.variantKey, visitors: r.visitors })) },
    });
    return out;
  }

  let best: VariantMetricRollup | null = null;
  let bestScore = -1;
  for (const r of withData) {
    const revScore = r.revenueCents / 100;
    const qualScore = (r.convRate ?? 0) * 100 + revScore * 0.01 - (r.costCents > 0 ? r.costCents / 1_000_000 : 0);
    if (qualScore > bestScore) {
      bestScore = qualScore;
      best = r;
    }
  }
  if (best && withData.length > 1) {
    out.push({
      kind: "promote_winner",
      title: `Leading variant: ${best.variantName}`,
      detail:
        "Weighted preview score favors this variant on conversion and revenue (heuristic). Validate with CRM revenue and paid snapshots before scaling.",
      evidence: {
        variantKey: best.variantKey,
        visitors: best.visitors,
        leads: best.leads,
        revenueCents: best.revenueCents,
      },
    });
    const laggard = withData.filter((r) => r.variantId !== best!.variantId).sort((a, b) => (a.leads - b.leads) || (a.visitors - b.visitors))[0];
    if (laggard && best.leads > laggard.leads + 1) {
      out.push({
        kind: "pause_underperformer",
        title: `Review variant: ${laggard.variantName}`,
        detail: "Lower lead volume than the leader with comparable traffic — consider pausing or redesigning.",
        evidence: { variantKey: laggard.variantKey, leads: laggard.leads, leaderLeads: best.leads },
      });
    }
  }

  const spendy = withData.find((r) => r.costCents > 0 && (r.leads === 0 || (r.convRate ?? 0) < 0.005));
  if (spendy) {
    out.push({
      kind: "budget_shift",
      title: "Spend with weak conversion signal",
      detail: "Cost is recorded but conversion rate is flat — verify CRM linkage and landing alignment.",
      evidence: { variantKey: spendy.variantKey, costCents: spendy.costCents, leads: spendy.leads },
    });
  }

  return out;
}
