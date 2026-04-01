/**
 * Ascendra Experimentation Engine — experiment CRUD and detail assembly.
 * Uses growth_experiments / growth_variants; AEE tables for links, metrics, insights.
 */
import { db } from "@server/db";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import {
  growthExperiments,
  growthVariants,
  aeeExperimentChannelLinks,
  aeeExperimentMetricsDaily,
  aeeExperimentInsights,
  aeeExperimentAuditLog,
} from "@shared/schema";

export type AeeExperimentListRow = {
  id: number;
  key: string;
  name: string;
  status: string;
  workspaceKey: string;
  funnelStage: string | null;
  offerType: string | null;
  primaryPersonaKey: string | null;
  variantCount: number;
  updatedAt: Date;
};

export async function listAeeExperiments(workspaceKey = "ascendra_main"): Promise<AeeExperimentListRow[]> {
  const exps = await db
    .select()
    .from(growthExperiments)
    .where(eq(growthExperiments.workspaceKey, workspaceKey))
    .orderBy(desc(growthExperiments.updatedAt));

  if (!exps.length) return [];

  const ids = exps.map((e) => e.id);
  const counts = await db
    .select({
      experimentId: growthVariants.experimentId,
      n: count(),
    })
    .from(growthVariants)
    .where(inArray(growthVariants.experimentId, ids))
    .groupBy(growthVariants.experimentId);

  const cmap = new Map(counts.map((c) => [c.experimentId, Number(c.n)]));

  return exps.map((e) => ({
    id: e.id,
    key: e.key,
    name: e.name,
    status: e.status,
    workspaceKey: e.workspaceKey,
    funnelStage: e.funnelStage,
    offerType: e.offerType,
    primaryPersonaKey: e.primaryPersonaKey,
    variantCount: cmap.get(e.id) ?? 0,
    updatedAt: e.updatedAt,
  }));
}

export type CreateAeeExperimentInput = {
  workspaceKey?: string;
  key: string;
  name: string;
  description?: string | null;
  hypothesis?: string | null;
  funnelStage?: string | null;
  primaryPersonaKey?: string | null;
  offerType?: string | null;
  channels?: string[];
  experimentTemplateKey?: string | null;
  status?: string;
  createdByUserId?: number | null;
  variants: Array<{
    key: string;
    name: string;
    config?: Record<string, unknown>;
    allocationWeight?: number;
    isControl?: boolean;
  }>;
};

export async function createAeeExperiment(input: CreateAeeExperimentInput): Promise<{ id: number }> {
  const ws = input.workspaceKey ?? "ascendra_main";
  if (!input.variants.length) {
    throw new Error("At least one variant is required.");
  }
  return db.transaction(async (tx) => {
    const [exp] = await tx
      .insert(growthExperiments)
      .values({
        workspaceKey: ws,
        key: input.key.trim(),
        name: input.name.trim(),
        description: input.description ?? null,
        hypothesis: input.hypothesis ?? null,
        funnelStage: input.funnelStage ?? null,
        primaryPersonaKey: input.primaryPersonaKey ?? null,
        offerType: input.offerType ?? null,
        channelsJson: input.channels ?? [],
        experimentTemplateKey: input.experimentTemplateKey ?? null,
        status: input.status ?? "draft",
        createdByUserId: input.createdByUserId ?? null,
        updatedAt: new Date(),
      })
      .returning({ id: growthExperiments.id });

    if (!exp) throw new Error("Insert failed");

    await tx.insert(growthVariants).values(
      input.variants.map((v, i) => ({
        experimentId: exp.id,
        key: v.key.trim(),
        name: v.name.trim(),
        config: v.config ?? {},
        allocationWeight: v.allocationWeight ?? 1,
        isControl: v.isControl ?? i === 0,
        updatedAt: new Date(),
      })),
    );

    await tx.insert(aeeExperimentAuditLog).values({
      experimentId: exp.id,
      actorUserId: input.createdByUserId ?? null,
      action: "created",
      payloadJson: { key: input.key, variantCount: input.variants.length },
    });

    return exp;
  });
}

export async function getAeeExperimentById(
  id: number,
  workspaceKey = "ascendra_main",
): Promise<{
  experiment: typeof growthExperiments.$inferSelect;
  variants: (typeof growthVariants.$inferSelect)[];
  channelLinks: (typeof aeeExperimentChannelLinks.$inferSelect)[];
  metricsPreview: (typeof aeeExperimentMetricsDaily.$inferSelect)[];
  insights: (typeof aeeExperimentInsights.$inferSelect)[];
} | null> {
  const [exp] = await db
    .select()
    .from(growthExperiments)
    .where(and(eq(growthExperiments.id, id), eq(growthExperiments.workspaceKey, workspaceKey)))
    .limit(1);
  if (!exp) return null;

  const variants = await db
    .select()
    .from(growthVariants)
    .where(eq(growthVariants.experimentId, id))
    .orderBy(growthVariants.id);

  const channelLinks = await db
    .select()
    .from(aeeExperimentChannelLinks)
    .where(eq(aeeExperimentChannelLinks.experimentId, id))
    .orderBy(desc(aeeExperimentChannelLinks.createdAt));

  const metricsPreview = await db
    .select()
    .from(aeeExperimentMetricsDaily)
    .where(eq(aeeExperimentMetricsDaily.experimentId, id))
    .orderBy(desc(aeeExperimentMetricsDaily.metricDate))
    .limit(14);

  const insights = await db
    .select()
    .from(aeeExperimentInsights)
    .where(eq(aeeExperimentInsights.experimentId, id))
    .orderBy(desc(aeeExperimentInsights.createdAt))
    .limit(50);

  return { experiment: exp, variants, channelLinks, metricsPreview, insights };
}
