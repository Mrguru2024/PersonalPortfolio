/**
 * Recomputes aee_experiment_metrics_daily for a UTC date range [from, to).
 * Idempotent: deletes existing rows for the workspace in that range, then inserts fresh aggregates.
 */
import { db } from "@server/db";
import {
  visitorActivity,
  growthExperiments,
  growthVariants,
  aeeExperimentMetricsDaily,
  aeeCrmAttributionEvents,
  aeeExperimentChannelLinks,
  ppcPerformanceSnapshots,
  type AeeCrmAttributionEvent,
} from "@shared/schema";
import { and, asc, eq, gte, inArray, isNotNull, lte, lt, sql } from "drizzle-orm";
import { resolveAeeIdsFromVisitorMeta, type ExperimentVariantMaps } from "./aeeRollupResolve";

export type AeeRollupResult = {
  workspaceKey: string;
  fromDate: string;
  toDate: string;
  visitorRowsScanned: number;
  rowsInserted: number;
};

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type AggKey = string;

function aggKey(
  workspaceKey: string,
  experimentId: number,
  variantId: number,
  dateStr: string,
  dimensionKey: string,
): AggKey {
  return `${workspaceKey}|${experimentId}|${variantId}|${dateStr}|${dimensionKey}`;
}

type Bucket = {
  impressions: number;
  clicks: number;
  ctaClicks: number;
  formSubmits: number;
  visitors: Set<string>;
  leads: number;
  bookedCalls: number;
  proposals: number;
  closedWon: number;
  closedLost: number;
  revenueCents: number;
  costCents: number;
};

function emptyBucket(): Bucket {
  return {
    impressions: 0,
    clicks: 0,
    ctaClicks: 0,
    formSubmits: 0,
    visitors: new Set(),
    leads: 0,
    bookedCalls: 0,
    proposals: 0,
    closedWon: 0,
    closedLost: 0,
    revenueCents: 0,
    costCents: 0,
  };
}

async function loadExperimentMaps(workspaceKey: string): Promise<ExperimentVariantMaps> {
  const exps = await db
    .select()
    .from(growthExperiments)
    .where(eq(growthExperiments.workspaceKey, workspaceKey));
  const expIds = exps.map((e) => e.id);
  if (!expIds.length) {
    return {
      byExperimentKey: new Map(),
      byExperimentId: new Map(),
      variantsByExperimentId: new Map(),
    };
  }
  const vars = await db.select().from(growthVariants).where(inArray(growthVariants.experimentId, expIds));
  const variantsByExperimentId = new Map<number, Map<string, number>>();
  for (const v of vars) {
    if (!variantsByExperimentId.has(v.experimentId)) variantsByExperimentId.set(v.experimentId, new Map());
    variantsByExperimentId.get(v.experimentId)!.set(v.key, v.id);
  }
  const byExperimentKey = new Map<string, { experimentId: number; workspaceKey: string }>();
  const byExperimentId = new Map<number, { experimentId: number; workspaceKey: string }>();
  for (const e of exps) {
    byExperimentKey.set(e.key, { experimentId: e.id, workspaceKey: e.workspaceKey });
    byExperimentId.set(e.id, { experimentId: e.id, workspaceKey: e.workspaceKey });
  }
  return { byExperimentKey, byExperimentId, variantsByExperimentId };
}

async function aggregateVisitorActivity(
  workspaceKey: string,
  maps: ExperimentVariantMaps,
  from: Date,
  to: Date,
): Promise<{ buckets: Map<AggKey, Bucket>; rowsScanned: number }> {
  const rows = await db
    .select({
      createdAt: visitorActivity.createdAt,
      visitorId: visitorActivity.visitorId,
      eventType: visitorActivity.eventType,
      region: visitorActivity.region,
      metadata: visitorActivity.metadata,
    })
    .from(visitorActivity)
    .where(
      and(
        gte(visitorActivity.createdAt, from),
        lt(visitorActivity.createdAt, to),
        isNotNull(visitorActivity.metadata),
        sql`(${visitorActivity.metadata}::jsonb ? 'experiment_key' OR ${visitorActivity.metadata}::jsonb ? 'experiment_id')`,
      ),
    )
    .limit(100_000);

  const buckets = new Map<AggKey, Bucket>();

  for (const row of rows) {
    const resolved = resolveAeeIdsFromVisitorMeta(row.metadata, maps, row.region);
    if (!resolved) continue;
    if (resolved.workspaceKey !== workspaceKey) continue;

    const d = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt as string);
    const dateStr = toDateKey(d);

    for (const dimensionKey of resolved.dimensionKeys) {
      const k = aggKey(workspaceKey, resolved.experimentId, resolved.variantId, dateStr, dimensionKey);
      let b = buckets.get(k);
      if (!b) {
        b = emptyBucket();
        buckets.set(k, b);
      }
      b.visitors.add(row.visitorId);
      const et = row.eventType;
      if (et === "page_view") b.impressions += 1;
      if (et === "cta_click") {
        b.ctaClicks += 1;
        b.clicks += 1;
      }
      if (et === "form_submit" || et === "form_completed") b.formSubmits += 1;
    }
  }

  return { buckets, rowsScanned: rows.length };
}

function mergeCrmAttributionEventsIntoBuckets(
  workspaceKey: string,
  maps: ExperimentVariantMaps,
  buckets: Map<AggKey, Bucket>,
  events: AeeCrmAttributionEvent[],
): number {
  let n = 0;
  for (const ev of events) {
    if (ev.experimentId == null || ev.variantId == null) continue;
    const expMeta = maps.byExperimentId.get(ev.experimentId);
    if (!expMeta || expMeta.workspaceKey !== workspaceKey) continue;

    const d = ev.occurredAt instanceof Date ? ev.occurredAt : new Date(ev.occurredAt as string);
    const dateStr = toDateKey(d);
    const dimensionKey = "total";
    const k = aggKey(workspaceKey, ev.experimentId, ev.variantId, dateStr, dimensionKey);
    let b = buckets.get(k);
    if (!b) {
      b = emptyBucket();
      buckets.set(k, b);
    }
    n++;
    switch (ev.eventKind) {
      case "lead_created":
        b.leads += 1;
        break;
      case "booked_call":
        b.bookedCalls += 1;
        break;
      case "proposal":
        b.proposals += 1;
        break;
      case "closed_won":
        b.closedWon += 1;
        b.revenueCents += ev.valueCents ?? 0;
        break;
      case "closed_lost":
        b.closedLost += 1;
        break;
      default:
        break;
    }
  }
  return n;
}

const variantWeightsCache = new Map<number, Array<{ id: number; weight: number }>>();

async function variantWeightsForExperiment(experimentId: number): Promise<Array<{ id: number; weight: number }>> {
  if (variantWeightsCache.has(experimentId)) return variantWeightsCache.get(experimentId)!;
  const vs = await db
    .select({ id: growthVariants.id, w: growthVariants.allocationWeight })
    .from(growthVariants)
    .where(eq(growthVariants.experimentId, experimentId))
    .orderBy(asc(growthVariants.id));
  const out = vs.map((v) => ({ id: v.id, weight: typeof v.w === "number" && v.w > 0 ? v.w : 1 }));
  variantWeightsCache.set(experimentId, out);
  return out;
}

async function mergePpcSnapshotsIntoBuckets(
  workspaceKey: string,
  maps: ExperimentVariantMaps,
  fromStr: string,
  toStr: string,
  buckets: Map<AggKey, Bucket>,
): Promise<void> {
  const links = await db
    .select()
    .from(aeeExperimentChannelLinks)
    .where(sql`${aeeExperimentChannelLinks.ppcCampaignId} is not null`);

  for (const link of links) {
    if (link.ppcCampaignId == null) continue;
    const expRow = maps.byExperimentId.get(link.experimentId);
    if (!expRow || expRow.workspaceKey !== workspaceKey) continue;

    const snaps = await db
      .select()
      .from(ppcPerformanceSnapshots)
      .where(
        and(
          eq(ppcPerformanceSnapshots.campaignId, link.ppcCampaignId),
          gte(ppcPerformanceSnapshots.snapshotDate, fromStr),
          lte(ppcPerformanceSnapshots.snapshotDate, toStr),
        ),
      );

    for (const s of snaps) {
      const dateRaw = s.snapshotDate as unknown;
      const dateStr =
        typeof dateRaw === "string"
          ? dateRaw.slice(0, 10)
          : dateRaw instanceof Date
            ? toDateKey(dateRaw)
            : String(dateRaw).slice(0, 10);
      const spend = s.spendCents ?? 0;
      const imp = s.impressions ?? 0;
      const clk = s.clicks ?? 0;

      let targets: Array<{ variantId: number; fraction: number }>;
      if (link.variantId != null) {
        targets = [{ variantId: link.variantId, fraction: 1 }];
      } else {
        const ws = await variantWeightsForExperiment(link.experimentId);
        const tw = ws.reduce((a: number, x: { weight: number }) => a + x.weight, 0) || 1;
        targets = ws.map((x: { id: number; weight: number }) => ({ variantId: x.id, fraction: x.weight / tw }));
      }

      for (const t of targets) {
        const k = aggKey(workspaceKey, link.experimentId, t.variantId, dateStr, "total");
        let b = buckets.get(k);
        if (!b) {
          b = emptyBucket();
          buckets.set(k, b);
        }
        b.costCents += Math.round(spend * t.fraction);
        b.impressions += Math.round(imp * t.fraction);
        b.clicks += Math.round(clk * t.fraction);
      }
    }
  }
}

export async function runAeeDailyRollup(input: {
  workspaceKey?: string;
  /** Inclusive start (UTC calendar day). */
  from: Date;
  /** Exclusive end. */
  to: Date;
}): Promise<AeeRollupResult> {
  const workspaceKey = input.workspaceKey ?? "ascendra_main";
  const from = input.from;
  const to = input.to;
  const fromStr = toDateKey(from);
  const toEnd = new Date(to.getTime() - 1);
  const toStr = toDateKey(toEnd);

  variantWeightsCache.clear();
  const maps = await loadExperimentMaps(workspaceKey);

  const { buckets, rowsScanned } = await aggregateVisitorActivity(workspaceKey, maps, from, to);

  const crmEvents = await db
    .select()
    .from(aeeCrmAttributionEvents)
    .where(
      and(
        eq(aeeCrmAttributionEvents.workspaceKey, workspaceKey),
        gte(aeeCrmAttributionEvents.occurredAt, from),
        lt(aeeCrmAttributionEvents.occurredAt, to),
      ),
    )
    .limit(50_000);
  mergeCrmAttributionEventsIntoBuckets(workspaceKey, maps, buckets, crmEvents);

  await mergePpcSnapshotsIntoBuckets(workspaceKey, maps, fromStr, toStr, buckets);

  await db
    .delete(aeeExperimentMetricsDaily)
    .where(
      and(
        eq(aeeExperimentMetricsDaily.workspaceKey, workspaceKey),
        gte(aeeExperimentMetricsDaily.metricDate, fromStr),
        lte(aeeExperimentMetricsDaily.metricDate, toStr),
      ),
    );

  const now = new Date();
  let inserted = 0;
  for (const [key, b] of buckets) {
    const parts = key.split("|");
      const ws = parts[0]!;
      const expId = Number.parseInt(parts[1]!, 10);
      const varId = Number.parseInt(parts[2]!, 10);
      const dateStr = parts[3]!;
      const dim = parts[4]!;
      if (ws !== workspaceKey) continue;
      await db.insert(aeeExperimentMetricsDaily).values({
        workspaceKey,
        experimentId: expId,
        variantId: varId,
        metricDate: dateStr,
        dimensionKey: dim,
        impressions: b.impressions,
        clicks: b.clicks,
        ctaClicks: b.ctaClicks,
        formSubmits: b.formSubmits,
        leads: b.leads,
        bookedCalls: b.bookedCalls,
        proposals: b.proposals,
        closedWon: b.closedWon,
        closedLost: b.closedLost,
        revenueCents: b.revenueCents,
        costCents: b.costCents,
        visitors: b.visitors.size,
        sourceRefsJson: { rollup: "v2", at: now.toISOString() },
        updatedAt: now,
      });
    inserted++;
  }

  return {
    workspaceKey,
    fromDate: fromStr,
    toDate: toStr,
    visitorRowsScanned: rowsScanned,
    rowsInserted: inserted,
  };
}
