import path from "node:path";
import { unlink } from "node:fs/promises";
import { db } from "@server/db";
import {
  behaviorSessions,
  behaviorHeatmapEvents,
  behaviorSurveyResponses,
  funnelContentAssets,
} from "@shared/schema";
import { and, desc, eq, isNotNull, isNull, lt } from "drizzle-orm";

export function getAscendraRetentionDays(): number {
  const n = Number(process.env.ASCENDRA_RETENTION_DAYS);
  return Number.isFinite(n) && n > 0 ? Math.min(3650, Math.floor(n)) : 90;
}

export function getAscendraRetentionPurgeGraceDays(): number {
  const n = Number(process.env.ASCENDRA_RETENTION_PURGE_GRACE_DAYS);
  return Number.isFinite(n) && n > 0 ? Math.min(365, Math.floor(n)) : 30;
}

export type AscendraRetentionSweepResult = {
  behaviorSoftDeleted: number;
  funnelAssetsSoftDeleted: number;
  behaviorHardDeleted: number;
  funnelAssetsHardDeleted: number;
  retentionDays: number;
  purgeGraceDays: number;
};

/** Mark old, non-exempt behavior sessions as trashed (still restorable for purgeGraceDays). */
export async function sweepBehaviorSessionsToTrash(): Promise<number> {
  const cutoff = new Date(Date.now() - getAscendraRetentionDays() * 24 * 60 * 60 * 1000);
  const rows = await db
    .update(behaviorSessions)
    .set({ softDeletedAt: new Date() })
    .where(
      and(
        isNull(behaviorSessions.softDeletedAt),
        eq(behaviorSessions.retentionImportant, false),
        eq(behaviorSessions.retentionArchived, false),
        lt(behaviorSessions.startTime, cutoff),
      ),
    )
    .returning({ id: behaviorSessions.id });
  return rows.length;
}

/** Draft funnel assets only (never auto-trash published). */
export async function sweepFunnelAssetsToTrash(): Promise<number> {
  const cutoff = new Date(Date.now() - getAscendraRetentionDays() * 24 * 60 * 60 * 1000);
  const rows = await db
    .update(funnelContentAssets)
    .set({ softDeletedAt: new Date() })
    .where(
      and(
        isNull(funnelContentAssets.softDeletedAt),
        eq(funnelContentAssets.retentionImportant, false),
        eq(funnelContentAssets.retentionArchived, false),
        eq(funnelContentAssets.status, "draft"),
        lt(funnelContentAssets.createdAt, cutoff),
      ),
    )
    .returning({ id: funnelContentAssets.id });
  return rows.length;
}

async function unlinkPublicUpload(fileUrl: string): Promise<void> {
  const rel = fileUrl.replace(/^\//, "");
  if (!rel.startsWith("uploads/")) return;
  const abs = path.resolve(process.cwd(), "public", rel);
  const root = path.resolve(process.cwd(), "public");
  if (!abs.startsWith(root)) return;
  try {
    await unlink(abs);
  } catch {
    /* missing file is fine */
  }
}

/** Permanently remove behavior sessions (and related rows) after purge grace. */
export async function hardDeleteExpiredBehaviorSessions(): Promise<number> {
  const graceCutoff = new Date(Date.now() - getAscendraRetentionPurgeGraceDays() * 24 * 60 * 60 * 1000);
  const doomed = await db
    .select({ id: behaviorSessions.id, sessionId: behaviorSessions.sessionId })
    .from(behaviorSessions)
    .where(and(isNotNull(behaviorSessions.softDeletedAt), lt(behaviorSessions.softDeletedAt, graceCutoff)));

  let n = 0;
  for (const row of doomed) {
    await db.delete(behaviorHeatmapEvents).where(eq(behaviorHeatmapEvents.sessionId, row.sessionId));
    await db.delete(behaviorSurveyResponses).where(eq(behaviorSurveyResponses.sessionId, row.sessionId));
    await db.delete(behaviorSessions).where(eq(behaviorSessions.id, row.id));
    n += 1;
  }
  return n;
}

/** Permanently remove trashed funnel assets and their on-disk files. */
export async function hardDeleteExpiredFunnelAssets(): Promise<number> {
  const graceCutoff = new Date(Date.now() - getAscendraRetentionPurgeGraceDays() * 24 * 60 * 60 * 1000);
  const doomed = await db
    .select({ id: funnelContentAssets.id, fileUrl: funnelContentAssets.fileUrl })
    .from(funnelContentAssets)
    .where(and(isNotNull(funnelContentAssets.softDeletedAt), lt(funnelContentAssets.softDeletedAt, graceCutoff)));

  for (const row of doomed) {
    await unlinkPublicUpload(row.fileUrl);
    await db.delete(funnelContentAssets).where(eq(funnelContentAssets.id, row.id));
  }
  return doomed.length;
}

export async function runAscendraStorageRetentionSweep(): Promise<AscendraRetentionSweepResult> {
  const behaviorSoftDeleted = await sweepBehaviorSessionsToTrash();
  const funnelAssetsSoftDeleted = await sweepFunnelAssetsToTrash();
  const behaviorHardDeleted = await hardDeleteExpiredBehaviorSessions();
  const funnelAssetsHardDeleted = await hardDeleteExpiredFunnelAssets();
  return {
    behaviorSoftDeleted,
    funnelAssetsSoftDeleted,
    behaviorHardDeleted,
    funnelAssetsHardDeleted,
    retentionDays: getAscendraRetentionDays(),
    purgeGraceDays: getAscendraRetentionPurgeGraceDays(),
  };
}

export async function listTrashedBehaviorSessions(limit = 50) {
  return db
    .select({
      id: behaviorSessions.id,
      sessionId: behaviorSessions.sessionId,
      startTime: behaviorSessions.startTime,
      softDeletedAt: behaviorSessions.softDeletedAt,
      retentionImportant: behaviorSessions.retentionImportant,
      retentionArchived: behaviorSessions.retentionArchived,
    })
    .from(behaviorSessions)
    .where(isNotNull(behaviorSessions.softDeletedAt))
    .orderBy(desc(behaviorSessions.softDeletedAt))
    .limit(Math.min(200, limit));
}

export async function listTrashedFunnelAssets(limit = 50) {
  return db
    .select({
      id: funnelContentAssets.id,
      title: funnelContentAssets.title,
      fileUrl: funnelContentAssets.fileUrl,
      status: funnelContentAssets.status,
      softDeletedAt: funnelContentAssets.softDeletedAt,
    })
    .from(funnelContentAssets)
    .where(isNotNull(funnelContentAssets.softDeletedAt))
    .orderBy(desc(funnelContentAssets.softDeletedAt))
    .limit(Math.min(200, limit));
}

export async function restoreBehaviorSessionBySessionId(sessionId: string): Promise<boolean> {
  const sid = sessionId.slice(0, 128);
  const rows = await db
    .update(behaviorSessions)
    .set({ softDeletedAt: null })
    .where(eq(behaviorSessions.sessionId, sid))
    .returning({ id: behaviorSessions.id });
  return rows.length > 0;
}

export async function restoreFunnelAssetById(id: number): Promise<boolean> {
  const rows = await db
    .update(funnelContentAssets)
    .set({ softDeletedAt: null })
    .where(eq(funnelContentAssets.id, id))
    .returning({ id: funnelContentAssets.id });
  return rows.length > 0;
}
