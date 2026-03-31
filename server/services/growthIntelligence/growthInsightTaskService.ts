import { db } from "@server/db";
import { growthInsightExperimentLinks, growthInsightTasks } from "@shared/schema";
import { and, desc, eq, inArray, ne } from "drizzle-orm";

export async function listGrowthInsightTasks(limit = 100) {
  return db.select().from(growthInsightTasks).orderBy(desc(growthInsightTasks.updatedAt)).limit(Math.min(500, limit));
}

export async function getGrowthInsightTaskById(id: number) {
  const [row] = await db.select().from(growthInsightTasks).where(eq(growthInsightTasks.id, id)).limit(1);
  return row;
}

export async function createGrowthInsightTask(input: {
  title: string;
  body?: string | null;
  businessId?: string | null;
  visibleToClient?: boolean;
  clientCrmAccountId?: number | null;
  priority?: string;
  status?: string;
  assigneeUserId?: number | null;
  createdByUserId?: number | null;
  evidenceJson?: Record<string, unknown>;
  pagePath?: string | null;
  behaviorSessionKey?: string | null;
  surveyId?: number | null;
  heatmapPage?: string | null;
}) {
  const accountId = input.clientCrmAccountId;
  const visible = input.visibleToClient === true && accountId != null && accountId > 0;
  const [row] = await db
    .insert(growthInsightTasks)
    .values({
      title: input.title.slice(0, 500),
      body: input.body?.slice(0, 24_000) ?? null,
      businessId: input.businessId?.trim() || null,
      visibleToClient: visible,
      clientCrmAccountId: visible ? accountId! : null,
      priority: input.priority?.trim() || "medium",
      status: input.status?.trim() || "open",
      assigneeUserId: input.assigneeUserId ?? null,
      createdByUserId: input.createdByUserId ?? null,
      evidenceJson: input.evidenceJson ?? {},
      pagePath: input.pagePath?.trim() || null,
      behaviorSessionKey: input.behaviorSessionKey?.trim() || null,
      surveyId: input.surveyId ?? null,
      heatmapPage: input.heatmapPage?.trim() || null,
    })
    .returning();
  return row;
}

export async function updateGrowthInsightTask(
  id: number,
  patch: Partial<{
    title: string;
    body: string | null;
    status: string;
    priority: string;
    visibleToClient: boolean;
    clientCrmAccountId: number | null;
    assigneeUserId: number | null;
    evidenceJson: Record<string, unknown>;
    pagePath: string | null;
    behaviorSessionKey: string | null;
    surveyId: number | null;
    heatmapPage: string | null;
  }>,
) {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) updates[k] = v;
  }
  if (updates.visibleToClient === false) {
    updates.clientCrmAccountId = null;
  }
  const [row] = await db.update(growthInsightTasks).set(updates).where(eq(growthInsightTasks.id, id)).returning();
  return row;
}

/** Client portal: shared improvements scoped to CRM accounts the user belongs to. */
export async function listClientVisibleInsightTasks(crmAccountIds: number[], limit = 80) {
  const ids = [...new Set(crmAccountIds.filter((n) => Number.isFinite(n) && n > 0))];
  if (ids.length < 1) return [];
  const cap = Math.min(200, Math.max(1, limit));
  return db
    .select()
    .from(growthInsightTasks)
    .where(
      and(
        eq(growthInsightTasks.visibleToClient, true),
        inArray(growthInsightTasks.clientCrmAccountId, ids),
        ne(growthInsightTasks.status, "cancelled"),
      ),
    )
    .orderBy(desc(growthInsightTasks.updatedAt))
    .limit(cap);
}

export async function linkTaskToExperiment(input: {
  insightTaskId: number;
  growthExperimentId?: number | null;
  experimentKey?: string | null;
  variantNotes?: string | null;
  preMetricsJson?: Record<string, unknown> | null;
}) {
  const [row] = await db
    .insert(growthInsightExperimentLinks)
    .values({
      insightTaskId: input.insightTaskId,
      growthExperimentId: input.growthExperimentId ?? null,
      experimentKey: input.experimentKey?.trim() || null,
      variantNotes: input.variantNotes?.trim() || null,
      preMetricsJson: input.preMetricsJson ?? undefined,
    })
    .returning();
  return row;
}

export async function listExperimentLinksForTask(taskId: number) {
  return db
    .select()
    .from(growthInsightExperimentLinks)
    .where(eq(growthInsightExperimentLinks.insightTaskId, taskId))
    .orderBy(desc(growthInsightExperimentLinks.createdAt));
}
