import { db } from "@server/db";
import {
  internalAuditRuns,
  internalAuditScores,
  internalAuditRecommendations,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { runLeadAlignmentEngine } from "./leadAlignmentEngine";
import { buildClientSafeAuditSummary } from "@/lib/internal-audit/buildClientSafeAuditSummary";
import type { LeadAuditEvidenceItem } from "@/lib/internal-audit/leadAuditCategories";

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
    const { categories, dbSnapshot } = await runLeadAlignmentEngine(input.projectKey);

    const categoryEvidence = Object.fromEntries(
      categories.map((c) => [c.categoryKey, c.evidence]),
    ) as Record<string, unknown>;

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
          dbSnapshot,
          categoryEvidence,
          evidenceVersion: 1,
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

type SummaryJson = {
  categoryEvidence?: Record<string, LeadAuditEvidenceItem[]>;
  dbSnapshot?: Record<string, number>;
};

function attachEvidenceToScores(
  run: NonNullable<Awaited<ReturnType<typeof getAuditRunById>>>["run"],
  scores: NonNullable<Awaited<ReturnType<typeof getAuditRunById>>>["scores"],
): Array<(typeof scores)[number] & { evidence: LeadAuditEvidenceItem[] }> {
  const summary = run.summaryJson as SummaryJson | null | undefined;
  const byCat = summary?.categoryEvidence;
  return scores.map((s) => ({
    ...s,
    evidence: byCat?.[s.categoryKey] ?? [],
  }));
}

/** Filter scores/recommendations in memory for dashboard (or extend with SQL ILIKE later). */
export function filterAuditDetail(
  detail: NonNullable<Awaited<ReturnType<typeof getAuditRunById>>>,
  filters: { categoryKey?: string; pathSubstring?: string },
) {
  let { scores, recommendations } = detail;
  let scoresWithEvidence = attachEvidenceToScores(detail.run, scores);

  if (filters.categoryKey) {
    scoresWithEvidence = scoresWithEvidence.filter((s) => s.categoryKey === filters.categoryKey);
    recommendations = recommendations.filter((r) => r.categoryKey === filters.categoryKey);
  }
  if (filters.pathSubstring) {
    const sub = filters.pathSubstring.toLowerCase();
    recommendations = recommendations.filter((r) =>
      (r.relatedPaths as string[] | null)?.some((p) => p.toLowerCase().includes(sub)),
    );
  }

  return { ...detail, scores: scoresWithEvidence, recommendations };
}
