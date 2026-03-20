import {
  LEAD_AUDIT_CATEGORY_KEYS,
  LEAD_AUDIT_CATEGORY_LABELS,
  type LeadAuditCategoryKey,
} from "./leadAuditCategories";

/** Architecture for future client API — admin-only until explicitly exposed. */
export interface ClientSafeAuditSummary {
  version: 1;
  projectKey: string;
  runId: number;
  completedAt: string | null;
  overallScore: number;
  categories: Array<{
    key: LeadAuditCategoryKey;
    label: string;
    score: number;
    headline: string;
  }>;
  topActions: string[];
}

export function buildClientSafeAuditSummary(input: {
  runId: number;
  projectKey: string;
  completedAt: Date | null;
  scores: Array<{
    categoryKey: string;
    score: number;
    strengthState: string;
  }>;
  recommendations: Array<{ title: string; priority: string }>;
}): ClientSafeAuditSummary {
  const catScores = input.scores.filter((s) =>
    LEAD_AUDIT_CATEGORY_KEYS.includes(s.categoryKey as LeadAuditCategoryKey),
  ) as Array<{ categoryKey: LeadAuditCategoryKey; score: number; strengthState: string }>;

  const overall =
    catScores.length === 0
      ? 0
      : Math.round(catScores.reduce((a, s) => a + s.score, 0) / catScores.length);

  const categories = catScores.map((s) => ({
    key: s.categoryKey,
    label: LEAD_AUDIT_CATEGORY_LABELS[s.categoryKey],
    score: s.score,
    headline:
      s.strengthState === "strength"
        ? "On track"
        : s.strengthState === "weakness"
          ? "Needs attention"
          : "Review recommended",
  }));

  const topActions = [...input.recommendations]
    .sort((a, b) => {
      const order = (p: string) =>
        p === "p0" ? 0 : p === "p1" ? 1 : p === "p2" ? 2 : 3;
      return order(a.priority) - order(b.priority);
    })
    .slice(0, 5)
    .map((r) => r.title);

  return {
    version: 1,
    projectKey: input.projectKey,
    runId: input.runId,
    completedAt: input.completedAt?.toISOString() ?? null,
    overallScore: overall,
    categories,
    topActions,
  };
}
