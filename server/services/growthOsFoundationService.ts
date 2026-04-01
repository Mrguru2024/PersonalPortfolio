import { db } from "@server/db";
import {
  gosModuleRegistry,
  gosEntityVisibilityOverrides,
  gosInternalNotes,
  gosClientSafeReportShares,
  gosAccessAuditEvents,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import type { DataVisibilityTier } from "@shared/accessScope";
import { createHash, randomBytes } from "crypto";

export const GOS_DEFAULT_MODULES: Array<{
  moduleKey: string;
  displayName: string;
  description: string;
  defaultDataVisibility: DataVisibilityTier;
  minAdminAccessRole: "ADMIN";
}> = [
  {
    moduleKey: "growth_os_core",
    displayName: "Growth OS core",
    description: "Hub, access model, and cross-module orchestration.",
    defaultDataVisibility: "internal_only",
    minAdminAccessRole: "ADMIN",
  },
  {
    moduleKey: "lead_intelligence",
    displayName: "Lead intelligence",
    description: "Scoring, intent, research profiles, AI guidance (internal reasoning).",
    defaultDataVisibility: "internal_only",
    minAdminAccessRole: "ADMIN",
  },
  {
    moduleKey: "content_operations",
    displayName: "Content operations",
    description: "Funnel CMS, offers, lead magnets, editorial workflows.",
    defaultDataVisibility: "internal_only",
    minAdminAccessRole: "ADMIN",
  },
  {
    moduleKey: "measurement",
    displayName: "Measurement & experiments",
    description: "Visitor activity, attribution, growth experiments.",
    defaultDataVisibility: "internal_only",
    minAdminAccessRole: "ADMIN",
  },
  {
    moduleKey: "client_reports",
    displayName: "Client-safe reports",
    description: "Sanitized summaries shared via token links.",
    defaultDataVisibility: "client_visible",
    minAdminAccessRole: "ADMIN",
  },
  {
    moduleKey: "gos_intelligence_phase3",
    displayName: "Growth intelligence",
    description: "AI content insights, research providers, dashboards, automation hooks.",
    defaultDataVisibility: "internal_only",
    minAdminAccessRole: "ADMIN",
  },
  {
    moduleKey: "gos_research_providers",
    displayName: "Research providers",
    description: "Keyword/topic/headline discovery with live vs mock labeling.",
    defaultDataVisibility: "internal_only",
    minAdminAccessRole: "ADMIN",
  },
];

export async function ensureGosDefaultModules(): Promise<void> {
  const existingKeys = await db.select({ key: gosModuleRegistry.moduleKey }).from(gosModuleRegistry);
  const have = new Set(existingKeys.map((r) => r.key));
  const missing = GOS_DEFAULT_MODULES.filter((m) => !have.has(m.moduleKey));
  if (missing.length > 0) {
    await db.insert(gosModuleRegistry).values(
      missing.map((m) => ({
        moduleKey: m.moduleKey,
        displayName: m.displayName,
        description: m.description,
        defaultDataVisibility: m.defaultDataVisibility,
        minAdminAccessRole: m.minAdminAccessRole,
        active: true,
      })),
    );
  }

  const intel = GOS_DEFAULT_MODULES.find((m) => m.moduleKey === "gos_intelligence_phase3");
  if (intel) {
    await db
      .update(gosModuleRegistry)
      .set({
        displayName: intel.displayName,
        description: intel.description,
      })
      .where(eq(gosModuleRegistry.moduleKey, "gos_intelligence_phase3"));
  }
}

export async function listGosModules() {
  return db.select().from(gosModuleRegistry).orderBy(gosModuleRegistry.moduleKey);
}

export async function listEntityVisibilityOverrides() {
  return db
    .select()
    .from(gosEntityVisibilityOverrides)
    .orderBy(desc(gosEntityVisibilityOverrides.updatedAt))
    .limit(100);
}

export async function upsertEntityVisibilityOverride(input: {
  entityType: string;
  entityId: string;
  visibility: string;
  updatedByUserId: number | null;
}) {
  const existing = await db
    .select()
    .from(gosEntityVisibilityOverrides)
    .where(
      and(
        eq(gosEntityVisibilityOverrides.entityType, input.entityType),
        eq(gosEntityVisibilityOverrides.entityId, input.entityId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(gosEntityVisibilityOverrides)
      .set({
        visibility: input.visibility,
        updatedByUserId: input.updatedByUserId,
        updatedAt: new Date(),
      })
      .where(eq(gosEntityVisibilityOverrides.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await db
    .insert(gosEntityVisibilityOverrides)
    .values({
      entityType: input.entityType,
      entityId: input.entityId,
      visibility: input.visibility,
      updatedByUserId: input.updatedByUserId,
    })
    .returning({ id: gosEntityVisibilityOverrides.id });
  if (!row) throw new Error("Failed to insert entity visibility override");
  return row.id;
}

export async function listInternalNotes(resourceType: string, resourceId: string) {
  return db
    .select()
    .from(gosInternalNotes)
    .where(
      and(
        eq(gosInternalNotes.resourceType, resourceType),
        eq(gosInternalNotes.resourceId, resourceId),
      ),
    )
    .orderBy(desc(gosInternalNotes.createdAt))
    .limit(50);
}

export async function createInternalNote(input: {
  resourceType: string;
  resourceId: string;
  body: string;
  authorUserId: number;
}) {
  const [row] = await db
    .insert(gosInternalNotes)
    .values({
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      body: input.body,
      authorUserId: input.authorUserId,
    })
    .returning();
  if (!row) throw new Error("Failed to create internal note");
  return row;
}

export function hashGosToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function generateGosShareToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createClientSafeReportShare(input: {
  resourceType: string;
  resourceId: string;
  summaryPayload: Record<string, unknown>;
  expiresAt: Date | null;
  createdByUserId: number | null;
}): Promise<{ id: number; rawToken: string }> {
  const rawToken = generateGosShareToken();
  const publicTokenHash = hashGosToken(rawToken);
  const [row] = await db
    .insert(gosClientSafeReportShares)
    .values({
      publicTokenHash,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      summaryPayload: input.summaryPayload,
      expiresAt: input.expiresAt,
      createdByUserId: input.createdByUserId,
    })
    .returning({ id: gosClientSafeReportShares.id });
  if (!row) throw new Error("Failed to insert client safe report share");
  return { id: row.id, rawToken };
}

export async function logGosAccessEvent(input: {
  actorUserId: number | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  visibilityContext?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await db.insert(gosAccessAuditEvents).values({
    actorUserId: input.actorUserId,
    action: input.action,
    resourceType: input.resourceType ?? null,
    resourceId: input.resourceId ?? null,
    visibilityContext: input.visibilityContext ?? null,
    metadata: input.metadata ?? null,
  });
}

export async function listRecentGosAuditEvents(limit = 30) {
  return db
    .select()
    .from(gosAccessAuditEvents)
    .orderBy(desc(gosAccessAuditEvents.createdAt))
    .limit(limit);
}

export type ClientSafeShareLookup =
  | { ok: false; reason: "not_found" | "expired" }
  | {
      ok: true;
      share: {
        id: number;
        resourceType: string;
        resourceId: string;
        summaryPayload: Record<string, unknown>;
        expiresAt: Date | null;
        createdAt: Date;
      };
    };

/**
 * Resolve a raw share token (from email/link) to the stored sanitized payload.
 * Does not log access by default — callers should log if needed.
 */
export async function getClientSafeShareByRawToken(rawToken: string): Promise<ClientSafeShareLookup> {
  const publicTokenHash = hashGosToken(rawToken.trim());
  const [row] = await db
    .select()
    .from(gosClientSafeReportShares)
    .where(eq(gosClientSafeReportShares.publicTokenHash, publicTokenHash))
    .limit(1);
  if (!row) return { ok: false, reason: "not_found" };
  if (row.expiresAt != null && row.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  return {
    ok: true,
    share: {
      id: row.id,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      summaryPayload: row.summaryPayload,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    },
  };
}
