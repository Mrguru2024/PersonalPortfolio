import { db } from "@server/db";
import {
  aosAgencyProjects,
  behaviorHeatmapEvents,
  behaviorReplaySegments,
  behaviorWatchReports,
  behaviorWatchTargets,
  crmAccounts,
  crmContacts,
} from "@shared/schema";
import { normalizePathPattern } from "@shared/behaviorWatchPath";
import {
  coerceHttpUrl,
  fullUrlPrefixToPathname,
  isWatchTargetScopeType,
  normalizeFullUrlPrefix,
  type WatchTargetScopeType,
} from "@shared/ascendraOsWatchScope";
import { and, count, desc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";

export { normalizePathPattern } from "@shared/behaviorWatchPath";

const DEFAULT_SESSION_CAP_MIN = 30;

function getAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000";
  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:3000";
  }
}

function inBusinessFilter(businessId: string) {
  return or(isNull(behaviorWatchTargets.businessId), eq(behaviorWatchTargets.businessId, businessId));
}

function isTargetInCollectWindow(
  t: typeof behaviorWatchTargets.$inferSelect,
  now: Date,
): boolean {
  if (t.collectFrom && now < t.collectFrom) return false;
  if (t.collectUntil && now > t.collectUntil) return false;
  return true;
}

export type PublicWatchTarget = {
  scopeType: WatchTargetScopeType;
  pathPattern: string;
  fullUrlPrefix: string | null;
  aosAgencyProjectId: number | null;
  metadataJson: Record<string, unknown>;
  recordReplay: boolean;
  recordHeatmap: boolean;
  maxSessionRecordingMinutes: number;
  collectFrom: string | null;
  collectUntil: string | null;
};

export async function getAosProjectPrimarySiteUrl(projectId: number): Promise<string | null> {
  const [p] = await db.select().from(aosAgencyProjects).where(eq(aosAgencyProjects.id, projectId)).limit(1);
  if (!p) return null;
  if (p.linkedCrmAccountId) {
    const [a] = await db
      .select({ website: crmAccounts.website })
      .from(crmAccounts)
      .where(eq(crmAccounts.id, p.linkedCrmAccountId))
      .limit(1);
    if (a?.website?.trim()) return a.website.trim();
  }
  if (p.linkedCrmContactId) {
    const [c] = await db
      .select({ websiteUrl: crmContacts.websiteUrl })
      .from(crmContacts)
      .where(eq(crmContacts.id, p.linkedCrmContactId))
      .limit(1);
    if (c?.websiteUrl?.trim()) return c.websiteUrl.trim();
  }
  return null;
}

/** Resolve DB row → effective paths + URL prefix for tracker and SQL. */
export async function materializeWatchTargetRow(
  row: typeof behaviorWatchTargets.$inferSelect,
): Promise<{ pathPattern: string; fullUrlPrefix: string | null }> {
  const scope = isWatchTargetScopeType(row.scopeType) ? row.scopeType : "path_prefix";
  let pathPattern = normalizePathPattern(row.pathPattern);
  let fullUrlPrefix = row.fullUrlPrefix?.trim() || null;

  if (scope === "full_url" && fullUrlPrefix) {
    try {
      fullUrlPrefix = normalizeFullUrlPrefix(fullUrlPrefix);
      pathPattern = fullUrlPrefixToPathname(fullUrlPrefix);
    } catch {
      /* keep stored path */
    }
  }

  if (scope === "aos_agency_project" && row.aosAgencyProjectId) {
    const site = await getAosProjectPrimarySiteUrl(row.aosAgencyProjectId);
    const u = coerceHttpUrl(site);
    if (u && u.origin === getAppOrigin()) {
      try {
        fullUrlPrefix = normalizeFullUrlPrefix(u.href);
        pathPattern = fullUrlPrefixToPathname(fullUrlPrefix);
      } catch {
        /* keep */
      }
    }
    /* External client site: keep stored pathPattern + optional stored fullUrlPrefix for monolith URLs. */
  }

  if (scope === "path_prefix") {
    fullUrlPrefix = null;
  }

  return { pathPattern, fullUrlPrefix };
}

async function toPublicWatchTarget(row: typeof behaviorWatchTargets.$inferSelect): Promise<PublicWatchTarget> {
  const mat = await materializeWatchTargetRow(row);
  const scope = isWatchTargetScopeType(row.scopeType) ? row.scopeType : "path_prefix";
  return {
    scopeType: scope,
    pathPattern: mat.pathPattern,
    fullUrlPrefix: mat.fullUrlPrefix,
    aosAgencyProjectId: row.aosAgencyProjectId ?? null,
    metadataJson: row.metadataJson ?? {},
    recordReplay: row.recordReplay,
    recordHeatmap: row.recordHeatmap,
    maxSessionRecordingMinutes: row.maxSessionRecordingMinutes ?? DEFAULT_SESSION_CAP_MIN,
    collectFrom: row.collectFrom?.toISOString() ?? null,
    collectUntil: row.collectUntil?.toISOString() ?? null,
  };
}

export async function getPublicWatchConfig(businessId?: string): Promise<{
  mode: "legacy_all" | "scoped";
  targets: PublicWatchTarget[];
}> {
  const biz = businessId?.trim();
  const rows = await db
    .select()
    .from(behaviorWatchTargets)
    .where(and(eq(behaviorWatchTargets.active, true), biz ? inBusinessFilter(biz) : sql`true`));

  const now = new Date();
  const effective = rows.filter((r) => isTargetInCollectWindow(r, now));

  if (effective.length === 0) {
    return { mode: "legacy_all", targets: [] };
  }

  const targets = await Promise.all(effective.map((r) => toPublicWatchTarget(r)));
  return { mode: "scoped", targets };
}

export async function listWatchTargetsForAdmin(businessId?: string) {
  const biz = businessId?.trim();
  if (!biz) {
    return db.select().from(behaviorWatchTargets).orderBy(desc(behaviorWatchTargets.updatedAt));
  }
  return db
    .select()
    .from(behaviorWatchTargets)
    .where(or(isNull(behaviorWatchTargets.businessId), eq(behaviorWatchTargets.businessId, biz)))
    .orderBy(desc(behaviorWatchTargets.updatedAt));
}

export type CreateWatchTargetInput = {
  name: string;
  scopeType?: string;
  pathPattern: string;
  fullUrlPrefix?: string | null;
  aosAgencyProjectId?: number | null;
  metadataJson?: Record<string, unknown> | null;
  businessId?: string | null;
  active?: boolean;
  recordReplay?: boolean;
  recordHeatmap?: boolean;
  maxSessionRecordingMinutes?: number | null;
  collectFrom?: Date | null;
  collectUntil?: Date | null;
};

async function normalizeCreateFields(
  input: CreateWatchTargetInput,
): Promise<{
  scopeType: string;
  pathPattern: string;
  fullUrlPrefix: string | null;
  aosAgencyProjectId: number | null;
  metadataJson: Record<string, unknown>;
}> {
  const scope = isWatchTargetScopeType(input.scopeType) ? input.scopeType : "path_prefix";
  let pathPattern = normalizePathPattern(input.pathPattern);
  let fullUrlPrefix = input.fullUrlPrefix?.trim() || null;
  const aosId = input.aosAgencyProjectId ?? null;
  const meta: Record<string, unknown> =
    input.metadataJson && typeof input.metadataJson === "object" && !Array.isArray(input.metadataJson) ?
      { ...(input.metadataJson as Record<string, unknown>) }
    : {};

  if (scope === "full_url") {
    if (!fullUrlPrefix) throw new Error("full_url scope requires a full URL");
    fullUrlPrefix = normalizeFullUrlPrefix(fullUrlPrefix);
    pathPattern = fullUrlPrefixToPathname(fullUrlPrefix);
  }

  if (scope === "aos_agency_project") {
    if (!aosId) throw new Error("aos_agency_project scope requires aosAgencyProjectId");
    const site = await getAosProjectPrimarySiteUrl(aosId);
    const u = coerceHttpUrl(site);
    if (u && u.origin === getAppOrigin()) {
      fullUrlPrefix = normalizeFullUrlPrefix(u.href);
      pathPattern = fullUrlPrefixToPathname(fullUrlPrefix);
    } else {
      pathPattern = normalizePathPattern(input.pathPattern);
      const manualUrl = input.fullUrlPrefix?.trim();
      fullUrlPrefix = manualUrl ? normalizeFullUrlPrefix(manualUrl) : null;
    }
  }

  if (scope === "path_prefix") {
    fullUrlPrefix = null;
  }

  return {
    scopeType: scope,
    pathPattern: pathPattern.slice(0, 2048),
    fullUrlPrefix: fullUrlPrefix ? fullUrlPrefix.slice(0, 2048) : null,
    aosAgencyProjectId: aosId,
    metadataJson: meta,
  };
}

export async function createWatchTarget(input: CreateWatchTargetInput) {
  const norm = await normalizeCreateFields(input);
  const [row] = await db
    .insert(behaviorWatchTargets)
    .values({
      name: input.name.slice(0, 256),
      scopeType: norm.scopeType,
      pathPattern: norm.pathPattern,
      fullUrlPrefix: norm.fullUrlPrefix,
      aosAgencyProjectId: norm.aosAgencyProjectId,
      metadataJson: norm.metadataJson,
      businessId: input.businessId?.trim() || null,
      active: input.active !== false,
      recordReplay: input.recordReplay !== false,
      recordHeatmap: input.recordHeatmap !== false,
      maxSessionRecordingMinutes: input.maxSessionRecordingMinutes ?? null,
      collectFrom: input.collectFrom ?? null,
      collectUntil: input.collectUntil ?? null,
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function updateWatchTarget(
  id: number,
  patch: Partial<{
    name: string;
    scopeType: string;
    pathPattern: string;
    fullUrlPrefix: string | null;
    aosAgencyProjectId: number | null;
    metadataJson: Record<string, unknown> | null;
    businessId: string | null;
    active: boolean;
    recordReplay: boolean;
    recordHeatmap: boolean;
    maxSessionRecordingMinutes: number | null;
    collectFrom: Date | null;
    collectUntil: Date | null;
  }>,
) {
  const base = {
    ...(patch.name !== undefined ? { name: patch.name.slice(0, 256) } : {}),
    ...(patch.scopeType !== undefined ?
      { scopeType: isWatchTargetScopeType(patch.scopeType) ? patch.scopeType : "path_prefix" }
    : {}),
    ...(patch.pathPattern !== undefined ?
      { pathPattern: normalizePathPattern(patch.pathPattern).slice(0, 2048) }
    : {}),
    ...(patch.fullUrlPrefix !== undefined ?
      {
        fullUrlPrefix: patch.fullUrlPrefix?.trim() ? normalizeFullUrlPrefix(patch.fullUrlPrefix).slice(0, 2048) : null,
      }
    : {}),
    ...(patch.aosAgencyProjectId !== undefined ? { aosAgencyProjectId: patch.aosAgencyProjectId } : {}),
    ...(patch.metadataJson !== undefined ? { metadataJson: patch.metadataJson ?? {} } : {}),
    ...(patch.businessId !== undefined ? { businessId: patch.businessId?.trim() || null } : {}),
    ...(patch.active !== undefined ? { active: patch.active } : {}),
    ...(patch.recordReplay !== undefined ? { recordReplay: patch.recordReplay } : {}),
    ...(patch.recordHeatmap !== undefined ? { recordHeatmap: patch.recordHeatmap } : {}),
    ...(patch.maxSessionRecordingMinutes !== undefined ?
      { maxSessionRecordingMinutes: patch.maxSessionRecordingMinutes }
    : {}),
    ...(patch.collectFrom !== undefined ? { collectFrom: patch.collectFrom } : {}),
    ...(patch.collectUntil !== undefined ? { collectUntil: patch.collectUntil } : {}),
    updatedAt: new Date(),
  };

  const [row] = await db.update(behaviorWatchTargets).set(base).where(eq(behaviorWatchTargets.id, id)).returning();
  return row ?? null;
}

export async function deleteWatchTarget(id: number): Promise<boolean> {
  const res = await db.delete(behaviorWatchTargets).where(eq(behaviorWatchTargets.id, id)).returning({ id: behaviorWatchTargets.id });
  return res.length > 0;
}

function heatmapPageMatchesPattern(pattern: string) {
  const p = normalizePathPattern(pattern);
  if (p === "/") return sql`true`;
  return sql`(
    ${behaviorHeatmapEvents.page} = ${p}
    OR ${behaviorHeatmapEvents.page} like ${`${p}/%`}
    OR ${behaviorHeatmapEvents.page} like ${`${p}?%`}
  )`;
}

function heatmapMatchesAnyPathPattern(patterns: string[]) {
  const normalized = [...new Set(patterns.map((x) => normalizePathPattern(x)))];
  if (normalized.length === 0) return sql`false`;
  const parts = normalized.map((p) => heatmapPageMatchesPattern(p));
  if (parts.length === 1) return parts[0];
  return or(...parts);
}

export async function computeWatchReportSummary(input: {
  pathPattern: string;
  periodStart: Date;
  periodEnd: Date;
}): Promise<Record<string, unknown>> {
  return computeWatchReportSummaryMulti({
    pathPatterns: [input.pathPattern],
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    label: input.pathPattern,
  });
}

export async function computeWatchReportSummaryMulti(input: {
  pathPatterns: string[];
  periodStart: Date;
  periodEnd: Date;
  label?: string;
}): Promise<Record<string, unknown>> {
  const { pathPatterns, periodStart, periodEnd } = input;
  const pageCond = heatmapMatchesAnyPathPattern(pathPatterns);

  const heatWhere = and(
    gte(behaviorHeatmapEvents.createdAt, periodStart),
    lte(behaviorHeatmapEvents.createdAt, periodEnd),
    pageCond,
  );

  const heatSessions = await db
    .select({ sessionId: behaviorHeatmapEvents.sessionId })
    .from(behaviorHeatmapEvents)
    .where(heatWhere)
    .groupBy(behaviorHeatmapEvents.sessionId);

  const sessionIds = heatSessions.map((r) => r.sessionId);

  const [heatClicksRow] = await db.select({ c: count() }).from(behaviorHeatmapEvents).where(heatWhere);

  const clickCount = count(behaviorHeatmapEvents.id);
  const topPages = await db
    .select({
      page: behaviorHeatmapEvents.page,
      clicks: clickCount,
    })
    .from(behaviorHeatmapEvents)
    .where(heatWhere)
    .groupBy(behaviorHeatmapEvents.page)
    .orderBy(desc(clickCount))
    .limit(15);

  let replaySegments = 0;
  let replaySessionsWithChunks = 0;
  if (sessionIds.length > 0) {
    const replayRows = await db
      .select({ sessionId: behaviorReplaySegments.sessionId, c: count() })
      .from(behaviorReplaySegments)
      .where(
        and(
          inArray(behaviorReplaySegments.sessionId, sessionIds),
          gte(behaviorReplaySegments.createdAt, periodStart),
          lte(behaviorReplaySegments.createdAt, periodEnd),
        ),
      )
      .groupBy(behaviorReplaySegments.sessionId);

    replaySessionsWithChunks = replayRows.length;
    replaySegments = replayRows.reduce((s, r) => s + Number(r.c), 0);
  }

  return {
    pathPatterns: pathPatterns.map((p) => normalizePathPattern(p)),
    label: input.label ?? null,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    uniqueSessionsWithHeatmap: sessionIds.length,
    heatmapClicks: Number(heatClicksRow?.c ?? 0),
    replaySessionsWithRecording: replaySessionsWithChunks,
    replaySegmentCount: replaySegments,
    topPages: topPages.map((r) => ({ page: r.page, clicks: Number(r.clicks) })),
    generatedAt: new Date().toISOString(),
  };
}

export async function computeMultiProjectWatchReport(input: {
  targetIds: number[];
  periodStart: Date;
  periodEnd: Date;
}): Promise<Record<string, unknown>> {
  const byTarget: Array<{ targetId: number; name: string; summary: Record<string, unknown> }> = [];
  const pathSet = new Set<string>();

  for (const tid of input.targetIds) {
    const row = await getWatchTargetById(tid);
    if (!row) continue;
    const mat = await materializeWatchTargetRow(row);
    pathSet.add(mat.pathPattern);
    const summary = await computeWatchReportSummaryMulti({
      pathPatterns: [mat.pathPattern],
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      label: row.name,
    });
    byTarget.push({ targetId: tid, name: row.name, summary });
  }

  const rollup = await computeWatchReportSummaryMulti({
    pathPatterns: [...pathSet],
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    label: "Combined",
  });

  return {
    mode: "multi_target",
    targetIds: input.targetIds,
    byTarget,
    rollup,
    periodStart: input.periodStart.toISOString(),
    periodEnd: input.periodEnd.toISOString(),
    generatedAt: new Date().toISOString(),
  };
}

export async function listWatchReportsForAdmin(limit: number) {
  return db
    .select()
    .from(behaviorWatchReports)
    .orderBy(desc(behaviorWatchReports.createdAt))
    .limit(Math.min(200, Math.max(1, limit)));
}

export async function createWatchReportRow(input: {
  targetId: number | null;
  title: string;
  periodStart: Date;
  periodEnd: Date;
  summaryJson: Record<string, unknown>;
  createdByUserId?: number | null;
}) {
  const [row] = await db
    .insert(behaviorWatchReports)
    .values({
      targetId: input.targetId,
      title: input.title.slice(0, 512),
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      summaryJson: input.summaryJson,
      createdByUserId: input.createdByUserId ?? null,
    })
    .returning();
  return row;
}

export async function deleteWatchReport(id: number): Promise<boolean> {
  const res = await db.delete(behaviorWatchReports).where(eq(behaviorWatchReports.id, id)).returning({ id: behaviorWatchReports.id });
  return res.length > 0;
}

export async function getWatchTargetById(id: number) {
  const [row] = await db.select().from(behaviorWatchTargets).where(eq(behaviorWatchTargets.id, id)).limit(1);
  return row ?? null;
}
