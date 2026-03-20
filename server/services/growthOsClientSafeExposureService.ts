import { db } from "@server/db";
import {
  internalAuditRuns,
  internalCmsDocuments,
  internalEditorialCalendarEntries,
  gosEntityVisibilityOverrides,
} from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import {
  type ClientSafeResourceType,
  isClientSafeResourceType,
  pickAllowlistedPayload,
  type ClientSafeEnvelope,
} from "@shared/clientSafe/gosExposurePolicies";
import type { DataVisibilityTier } from "@shared/accessScope";
import { buildClientSafeAuditSummary } from "@/lib/internal-audit/buildClientSafeAuditSummary";
import { stripForbiddenKeys } from "@/lib/growth-os/sanitize";
import { createClientSafeReportShare } from "./growthOsFoundationService";
import { getAuditRunById } from "@server/services/internalStudio/auditService";

async function effectiveVisibility(
  entityType: string,
  entityId: string,
  fallback: DataVisibilityTier,
): Promise<DataVisibilityTier> {
  const [row] = await db
    .select()
    .from(gosEntityVisibilityOverrides)
    .where(
      and(
        eq(gosEntityVisibilityOverrides.entityType, entityType),
        eq(gosEntityVisibilityOverrides.entityId, entityId),
      ),
    )
    .limit(1);
  const v = row?.visibility;
  if (v === "internal_only" || v === "client_visible" || v === "public_visible") return v;
  return fallback;
}

export async function buildClientSafePayloadForResource(input: {
  resourceType: ClientSafeResourceType;
  resourceId: string;
}): Promise<{ envelope: ClientSafeEnvelope; visibility: DataVisibilityTier } | null> {
  const { resourceType, resourceId } = input;

  if (resourceType === "internal_audit_run") {
    const runId = parseInt(resourceId, 10);
    if (Number.isNaN(runId)) return null;
    const [run] = await db.select().from(internalAuditRuns).where(eq(internalAuditRuns.id, runId)).limit(1);
    if (!run || run.status !== "completed") return null;
    const clientSafe = run.clientSafeSummaryJson as Record<string, unknown> | null;
    if (!clientSafe || typeof clientSafe !== "object") return null;
    const vis = await effectiveVisibility("internal_audit_run", resourceId, "client_visible");
    const payload = pickAllowlistedPayload(resourceType, {
      ...clientSafe,
      resourceType,
      resourceId,
      runId: run.id,
      projectKey: run.projectKey,
      completedAt: run.completedAt?.toISOString() ?? null,
    });
    const envelope: ClientSafeEnvelope = {
      version: 1,
      resourceType,
      resourceId,
      dataVisibility: vis,
      payload: stripForbiddenKeys(payload),
    };
    return { envelope, visibility: vis };
  }

  if (resourceType === "internal_cms_document") {
    const docId = parseInt(resourceId, 10);
    if (Number.isNaN(docId)) return null;
    const [doc] = await db.select().from(internalCmsDocuments).where(eq(internalCmsDocuments.id, docId)).limit(1);
    if (!doc) return null;
    const docVis =
      doc.visibility === "client_visible" || doc.visibility === "public_visible"
        ? (doc.visibility as DataVisibilityTier)
        : "internal_only";
    if (docVis === "internal_only") return null;
    const vis = await effectiveVisibility("internal_cms_document", resourceId, docVis);
    if (vis === "internal_only") return null;
    const raw = {
      version: 1,
      resourceType,
      resourceId,
      title: doc.title,
      excerpt: doc.excerpt ?? "",
      contentType: doc.contentType,
      workflowStatus: doc.workflowStatus,
      visibility: doc.visibility,
      publishedAt: doc.publishedAt?.toISOString() ?? null,
      scheduledPublishAt: doc.scheduledPublishAt?.toISOString() ?? null,
      platformTargets: doc.platformTargets ?? [],
      funnelStage: doc.funnelStage ?? "",
    };
    const payload = pickAllowlistedPayload(resourceType, raw as Record<string, unknown>);
    const envelope: ClientSafeEnvelope = {
      version: 1,
      resourceType,
      resourceId,
      dataVisibility: vis,
      payload: stripForbiddenKeys(payload),
    };
    return { envelope, visibility: vis };
  }

  if (resourceType === "internal_editorial_calendar_slice") {
    /** resourceId format: projectKey|YYYY-MM-DD|YYYY-MM-DD */
    const parts = resourceId.split("|");
    if (parts.length !== 3) return null;
    const [projectKey, startS, endS] = parts;
    const start = new Date(startS);
    const end = new Date(endS);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    const entries = await db
      .select({
        title: internalEditorialCalendarEntries.title,
        scheduledAt: internalEditorialCalendarEntries.scheduledAt,
        platformTargets: internalEditorialCalendarEntries.platformTargets,
        calendarStatus: internalEditorialCalendarEntries.calendarStatus,
      })
      .from(internalEditorialCalendarEntries)
      .where(
        and(
          eq(internalEditorialCalendarEntries.projectKey, projectKey),
          gte(internalEditorialCalendarEntries.scheduledAt, start),
          lte(internalEditorialCalendarEntries.scheduledAt, end),
        ),
      );
    const vis = await effectiveVisibility("internal_editorial_calendar_slice", resourceId, "client_visible");
    const raw = {
      version: 1,
      resourceType,
      resourceId,
      projectKey,
      windowLabel: `${startS} → ${endS}`,
      entries: entries.map((e) => ({
        title: e.title,
        scheduledAt: e.scheduledAt?.toISOString() ?? null,
        platformTargets: e.platformTargets ?? [],
        calendarStatus: e.calendarStatus,
      })),
    };
    const payload = pickAllowlistedPayload(resourceType, raw as Record<string, unknown>);
    const envelope: ClientSafeEnvelope = {
      version: 1,
      resourceType,
      resourceId,
      dataVisibility: vis,
      payload: stripForbiddenKeys(payload),
    };
    return { envelope, visibility: vis };
  }

  if (resourceType === "internal_custom_report") {
    return null;
  }

  return null;
}

/**
 * Build or refresh client-safe audit summary JSON on the run row (admin pipeline).
 */
export async function refreshClientSafeAuditSummaryOnRun(runId: number): Promise<void> {
  const detail = await getAuditRunById(runId);
  if (!detail?.run || detail.run.status !== "completed") return;
  const clientSafe = buildClientSafeAuditSummary({
    runId: detail.run.id,
    projectKey: detail.run.projectKey,
    completedAt: detail.run.completedAt ?? new Date(),
    scores: detail.scores.map((s) => ({
      categoryKey: s.categoryKey,
      score: s.score,
      strengthState: s.strengthState,
    })),
    recommendations: detail.recommendations.map((r) => ({ title: r.title, priority: r.priority })),
  });
  await db
    .update(internalAuditRuns)
    .set({ clientSafeSummaryJson: clientSafe as unknown as Record<string, unknown> })
    .where(eq(internalAuditRuns.id, runId));
}

export async function createShareFromBuiltResource(input: {
  resourceType: string;
  resourceId: string;
  expiresAt: Date | null;
  createdByUserId: number | null;
}): Promise<{ id: number; rawToken: string } | { error: string }> {
  if (!isClientSafeResourceType(input.resourceType)) {
    return { error: "Unsupported resource type" };
  }
  const built = await buildClientSafePayloadForResource({
    resourceType: input.resourceType,
    resourceId: input.resourceId,
  });
  if (!built) {
    return { error: "Resource not found or not eligible for client-safe export" };
  }
  if (built.visibility === "internal_only") {
    return { error: "Entity visibility is internal_only" };
  }
  const { rawToken, id } = await createClientSafeReportShare({
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    summaryPayload: built.envelope as unknown as Record<string, unknown>,
    expiresAt: input.expiresAt,
    createdByUserId: input.createdByUserId,
  });
  return { id, rawToken };
}
