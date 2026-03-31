import { db } from "@server/db";
import { growthInsightExperimentLinks, growthInsightTasks } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

export async function listGrowthInsightTasks(limit = 100) {
  return db.select().from(growthInsightTasks).orderBy(desc(growthInsightTasks.updatedAt)).limit(Math.min(500, limit));
}

export async function createGrowthInsightTask(input: {
  title: string;
  body?: string | null;
  businessId?: string | null;
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
  const [row] = await db
    .insert(growthInsightTasks)
    .values({
      title: input.title.slice(0, 500),
      body: input.body?.slice(0, 24_000) ?? null,
      businessId: input.businessId?.trim() || null,
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
  const [row] = await db.update(growthInsightTasks).set(updates).where(eq(growthInsightTasks.id, id)).returning();
  return row;
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
