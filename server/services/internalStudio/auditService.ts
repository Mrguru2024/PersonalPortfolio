import { db } from "@server/db";
import {
  internalAuditRuns,
  internalAuditScores,
  internalAuditRecommendations,
} from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { runLeadAlignmentEngine } from "./leadAlignmentEngine";
import { buildClientSafeAuditSummary } from "@/lib/internal-audit/buildClientSafeAuditSummary";

export async function listAuditRuns(filters: {
  projectKey?: string;
  status?: string;
  limit?: number;
}) {
  const lim = Math.min(filters.limit ?? 40, 100);
  const conditions = [];
  if (filters.projectKey) conditions.push(eq(internalAuditRuns.projectKey, filters.projectKey));
  if (filters.status) conditions.push(eq(internalAuditRuns.status, filters.status));

  if (conditions.length === 0) {
    return db
      .select()
      .from(internalAuditRuns)
      .orderBy(desc(internalAuditRuns.createdAt))
      .limit(lim);
  }
  return db
    .select()
    .from(internalAuditRuns)
    .where(and(...conditions))
    .orderBy(desc(internalAuditRuns.createdAt))
    .limit(lim);
}

export async function getAuditRunById(id: number) {
  const [run] = await db.select().from(internalAuditRuns).where(eq(internalAuditRuns.id, id)).limit(1);
  if (!run) return null;
  const scores = await db
    .select()
    .from(internalAuditScores)
    .where(eq(internalAuditScores.runId, id))
    .orderBy(internalAuditScores.categoryKey);
  const recommendations = await db
    .select()
    .from(internalAuditRecommendations)
    .where(eq(internalAuditRecommendations.runId, id))
    .orderBy(internalAuditRecommendations.sortOrder, internalAuditRecommendations.id);
  return { run, scores, recommendations };
}

export async function executeAuditRun(input: {
  projectKey: string;
  label?: string;
  triggeredByUserId: number | null;
}) {
  const [run] = await db
    .insert(internalAuditRuns)
    .values({
      projectKey: input.projectKey,
      label: input.label ?? `Lead alignment ${new Date().toISOString()}`,
      status: "running",
      triggeredByUserId: input.triggeredByUserId,
    })
    .returning();

  if (!run) throw new Error("Failed to create audit run");

  try {
    const categories = await runLeadAlignmentEngine(input.projectKey);

    for (const c of categories) {
      await db.insert(internalAuditScores).values({
        runId: run.id,
        categoryKey: c.categoryKey,
        score: c.score,
        strengthState: c.strengthState,
        whyItMatters: c.whyItMatters,
        risk: c.risk,
        implementationPriority: c.implementationPriority,
      });

      let order = 0;
      for (const r of c.recommendations) {
        await db.insert(internalAuditRecommendations).values({
          runId: run.id,
          categoryKey: c.categoryKey,
          title: r.title,
          detail: r.detail ?? null,
          relatedPaths: r.relatedPaths,
          priority: r.priority,
          sortOrder: order++,
        });
      }
    }

    const scoresRows = await db
      .select()
      .from(internalAuditScores)
      .where(eq(internalAuditScores.runId, run.id));
    const recRows = await db
      .select()
      .from(internalAuditRecommendations)
      .where(eq(internalAuditRecommendations.runId, run.id));

    const clientSafe = buildClientSafeAuditSummary({
      runId: run.id,
      projectKey: run.projectKey,
      completedAt: new Date(),
      scores: scoresRows.map((s) => ({
        categoryKey: s.categoryKey,
        score: s.score,
        strengthState: s.strengthState,
      })),
      recommendations: recRows.map((r) => ({ title: r.title, priority: r.priority })),
    });

    const overall =
      scoresRows.length === 0
        ? 0
        : Math.round(scoresRows.reduce((a, s) => a + s.score, 0) / scoresRows.length);

    await db
      .update(internalAuditRuns)
      .set({
        status: "completed",
        completedAt: new Date(),
        summaryJson: {
          overallScore: overall,
          categoryCount: categories.length,
          recommendationCount: recRows.length,
        },
        clientSafeSummaryJson: clientSafe as unknown as Record<string, unknown>,
        errorMessage: null,
      })
      .where(eq(internalAuditRuns.id, run.id));

    return getAuditRunById(run.id);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await db
      .update(internalAuditRuns)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorMessage: msg,
      })
      .where(eq(internalAuditRuns.id, run.id));
    throw e;
  }
}

/** Filter scores/recommendations in memory for dashboard (or extend with SQL ILIKE later). */
export function filterAuditDetail(
  detail: NonNullable<Awaited<ReturnType<typeof getAuditRunById>>>,
  filters: { categoryKey?: string; pathSubstring?: string },
) {
  let { scores, recommendations } = detail;
  if (filters.categoryKey) {
    scores = scores.filter((s) => s.categoryKey === filters.categoryKey);
    recommendations = recommendations.filter((r) => r.categoryKey === filters.categoryKey);
  }
  if (filters.pathSubstring) {
    const sub = filters.pathSubstring.toLowerCase();
    recommendations = recommendations.filter((r) =>
      (r.relatedPaths as string[] | null)?.some((p) => p.toLowerCase().includes(sub)),
    );
  }
  return { ...detail, scores, recommendations };
}
