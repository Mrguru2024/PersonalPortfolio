import { db } from "@server/db";
import {
  internalResearchBatches,
  internalResearchItems,
  internalCmsDocuments,
  internalEditorialCalendarEntries,
} from "@shared/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import {
  getResearchRunMode,
  resolveResearchProvider,
  type ResearchProviderContext,
} from "./researchProviders";

export async function runResearchDiscovery(input: {
  projectKey: string;
  seed: string;
  focus?: ResearchProviderContext["focus"];
  label?: string;
  createdByUserId: number | null;
}) {
  const mode = getResearchRunMode();
  const provider = resolveResearchProvider(mode);
  const items = await provider.runDiscovery({
    projectKey: input.projectKey,
    seed: input.seed,
    focus: input.focus,
  });

  const [batch] = await db
    .insert(internalResearchBatches)
    .values({
      projectKey: input.projectKey,
      label: input.label ?? `Research ${new Date().toISOString()}`,
      providerMode: mode,
      querySeed: input.seed,
      createdByUserId: input.createdByUserId,
    })
    .returning();

  if (!batch) throw new Error("Failed to create research batch");

  for (const it of items) {
    await db.insert(internalResearchItems).values({
      batchId: batch.id,
      itemKind: it.itemKind,
      phrase: it.phrase,
      source: it.source,
      confidence: it.confidence,
      trendDirection: it.trendDirection,
      relevanceScore: it.relevanceScore,
      audienceFit: it.audienceFit,
      suggestedUsage: it.suggestedUsage,
      relatedHeadlines: it.relatedHeadlines,
      relatedCtaOpportunities: it.relatedCtaOpportunities,
      metadataJson: { ...it.metadataJson, provider: provider.name },
      projectKey: input.projectKey,
    });
  }

  return { batchId: batch.id, itemCount: items.length, providerMode: mode, providerLabel: provider.name };
}

export async function listResearchItems(filters: {
  projectKey?: string;
  itemKind?: string;
  limit?: number;
  since?: Date;
}) {
  const lim = Math.min(filters.limit ?? 80, 200);
  const conditions = [];
  if (filters.projectKey) conditions.push(eq(internalResearchItems.projectKey, filters.projectKey));
  if (filters.itemKind) conditions.push(eq(internalResearchItems.itemKind, filters.itemKind));
  if (filters.since) conditions.push(gte(internalResearchItems.createdAt, filters.since));

  const q = db
    .select()
    .from(internalResearchItems)
    .orderBy(desc(internalResearchItems.createdAt))
    .limit(lim);
  if (conditions.length === 0) return q;
  return db
    .select()
    .from(internalResearchItems)
    .where(and(...conditions))
    .orderBy(desc(internalResearchItems.createdAt))
    .limit(lim);
}

export async function getWeeklyOpportunitySummary(projectKey: string) {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const rows = await listResearchItems({ projectKey, since, limit: 500 });
  const byKind: Record<string, number> = {};
  for (const r of rows) {
    byKind[r.itemKind] = (byKind[r.itemKind] ?? 0) + 1;
  }
  const top = [...rows]
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 12)
    .map((r) => ({
      id: r.id,
      phrase: r.phrase,
      itemKind: r.itemKind,
      relevanceScore: r.relevanceScore,
      trendDirection: r.trendDirection,
      suggestedUsage: r.suggestedUsage,
      source: r.source,
      createdAt: r.createdAt,
    }));
  return {
    windowDays: 7,
    projectKey,
    totalItems: rows.length,
    byKind,
    topOpportunities: top,
    dataMode: rows.some((r) => r.source === "openai") ? "mixed_or_live" : "mock_or_cached",
  };
}

export async function createDraftPostsFromKeyword(input: {
  projectKey: string;
  phrase: string;
  count: number;
  createdByUserId: number | null;
}) {
  const n = Math.min(Math.max(input.count, 1), 5);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const [doc] = await db
      .insert(internalCmsDocuments)
      .values({
        projectKey: input.projectKey,
        contentType: "social_caption",
        title: `${input.phrase} — draft ${i + 1}`,
        bodyHtml: `<p>Angle: ${input.phrase}. Expand with hook, story, single CTA.</p>`,
        excerpt: input.phrase,
        workflowStatus: "draft",
        visibility: "internal_only",
        tags: ["from_research", "auto_draft"],
      })
      .returning({ id: internalCmsDocuments.id });
    if (doc) out.push(doc.id);
  }
  return { documentIds: out };
}

export async function listRecentBatches(projectKey: string, limit = 20) {
  return db
    .select()
    .from(internalResearchBatches)
    .where(eq(internalResearchBatches.projectKey, projectKey))
    .orderBy(desc(internalResearchBatches.createdAt))
    .limit(limit);
}

function dayKeyUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function editorialGapDetection(projectKey: string) {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 14);
  const entries = await db
    .select({ scheduledAt: internalEditorialCalendarEntries.scheduledAt })
    .from(internalEditorialCalendarEntries)
    .where(
      and(
        eq(internalEditorialCalendarEntries.projectKey, projectKey),
        gte(internalEditorialCalendarEntries.scheduledAt, start),
        lte(internalEditorialCalendarEntries.scheduledAt, end),
      ),
    );
  const daysWith = new Set(
    entries
      .map((e) => (e.scheduledAt ? dayKeyUtc(new Date(e.scheduledAt)) : null))
      .filter((x): x is string => !!x),
  );
  const gaps: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = dayKeyUtc(d);
    if (d.getDay() !== 0 && d.getDay() !== 6 && !daysWith.has(key)) {
      gaps.push(key);
    }
  }
  return { projectKey, suggestedGapDates: gaps.slice(0, 10) };
}
