import { db } from "../db";
import { eq, desc, sql } from "drizzle-orm";
import {
  offerEngineOfferTemplates,
  offerEngineLeadMagnetTemplates,
  offerEngineFunnelPaths,
  offerEngineAnalyticsMetricDefinitions,
  marketingPersonas,
  type OfferEngineOfferTemplateRow,
  type OfferEngineLeadMagnetTemplateRow,
  type InsertOfferEngineOfferTemplateRow,
} from "@shared/schema";
import {
  defaultBridgeToPaid,
  defaultFunnelAlignment,
  defaultPerceivedOutcomeReview,
  defaultStrategyWhyConvert,
  personaStrategyLayerSchema,
  type PersonaStrategyLayer,
  type StrategyWhyConvert,
  type PerceivedOutcomeReview,
  type FunnelAlignment,
  funnelPathWriteSchema,
} from "@shared/offerEngineTypes";
import type { z } from "zod";
import type { offerTemplateWriteSchema, leadMagnetTemplateWriteSchema } from "@shared/offerEngineTypes";
import { getMarketingPersona, listMarketingPersonas, type MarketingPersonaDTO } from "./ascendraIntelligenceService";
import { scoreOfferTemplate, scoreLeadMagnetTemplate } from "./offerEngineScoring";
import { evaluateOfferWarnings, evaluateLeadMagnetWarnings } from "./offerEngineWarnings";
import { generateOfferCopyBlocks, generateLeadMagnetCopyBlocks } from "./offerEngineCopy";
import type { CtaGoal } from "@shared/offerEngineConstants";
import type { AscendraPricingPackage } from "@shared/ascendraPricingPackageTypes";
import { ensurePricingPackage, refreshPricingPackageComputed } from "@shared/ascendraPricingEngine";
import {
  buildOfferAndLeadMagnetGradingRows,
  buildOfferEngineRelationshipInsights,
  getOfferEngineReadinessAlerts,
} from "./offerEngineIntelligence";

type OfferWrite = z.infer<typeof offerTemplateWriteSchema>;
type LeadMagnetWrite = z.infer<typeof leadMagnetTemplateWriteSchema>;
type FunnelPathWrite = z.infer<typeof funnelPathWriteSchema>;

function recomputeOfferPatch(row: OfferEngineOfferTemplateRow) {
  const scored = scoreOfferTemplate(row);
  const warnings = evaluateOfferWarnings({
    primaryPromise: row.primaryPromise,
    coreProblem: row.coreProblem,
    desiredOutcome: row.desiredOutcome,
    strategyWhyConvert: row.strategyWhyConvertJson,
    perceived: row.perceivedOutcomeReviewJson,
    funnel: row.funnelAlignmentJson,
    ctaGoal: row.ctaGoal as CtaGoal,
    audienceTemperature: row.funnelAlignmentJson.audienceTemperature,
  });
  return { scoreCacheJson: scored, warningsJson: warnings, updatedAt: new Date() };
}

function recomputeLmRow(row: OfferEngineLeadMagnetTemplateRow) {
  const scored = scoreLeadMagnetTemplate(row);
  const warnings = evaluateLeadMagnetWarnings({
    promiseHook: row.promiseHook,
    smallQuickWin: row.smallQuickWin,
    bridge: row.bridgeToPaidJson,
    perceived: row.perceivedOutcomeReviewJson,
    funnel: row.funnelAlignmentJson,
  });
  return { scoreCacheJson: scored, warningsJson: warnings, updatedAt: new Date() };
}

export async function listOfferTemplates(filters?: {
  personaId?: string;
  status?: string;
  minScore?: number;
  q?: string;
}): Promise<OfferEngineOfferTemplateRow[]> {
  const rows = await db.select().from(offerEngineOfferTemplates).orderBy(desc(offerEngineOfferTemplates.updatedAt));
  return rows.filter((r) => {
    if (filters?.personaId && r.personaId !== filters.personaId) return false;
    if (filters?.status && r.status !== filters.status) return false;
    if (filters?.minScore != null && (r.scoreCacheJson?.overall ?? 0) < filters.minScore) return false;
    if (filters?.q) {
      const qq = filters.q.toLowerCase();
      if (!r.name.toLowerCase().includes(qq) && !r.slug.toLowerCase().includes(qq)) return false;
    }
    return true;
  });
}

export async function getOfferTemplate(id: number): Promise<OfferEngineOfferTemplateRow | null> {
  const [r] = await db.select().from(offerEngineOfferTemplates).where(eq(offerEngineOfferTemplates.id, id)).limit(1);
  return r ?? null;
}

export async function getOfferTemplateBySlug(slug: string): Promise<OfferEngineOfferTemplateRow | null> {
  const [r] = await db
    .select()
    .from(offerEngineOfferTemplates)
    .where(eq(offerEngineOfferTemplates.slug, slug))
    .limit(1);
  return r ?? null;
}

function offerWriteToRowValues(
  data: OfferWrite,
  defaults: {
    strategyWhyConvert: StrategyWhyConvert;
    perceivedOutcomeReview: PerceivedOutcomeReview;
    funnelAlignment: FunnelAlignment;
  },
): InsertOfferEngineOfferTemplateRow {
  return {
    slug: data.slug.trim().toLowerCase(),
    name: data.name.trim(),
    personaId: data.personaId.trim(),
    industryNiche: data.industryNiche ?? null,
    offerType: data.offerType,
    buyerAwareness: data.buyerAwareness,
    coreProblem: data.coreProblem ?? null,
    desiredOutcome: data.desiredOutcome ?? null,
    emotionalDriversJson: data.emotionalDrivers ?? [],
    primaryPromise: data.primaryPromise ?? null,
    tangibleDeliverables: data.tangibleDeliverables ?? null,
    timeToFirstWin: data.timeToFirstWin ?? null,
    trustBuilderType: data.trustBuilderType,
    pricingModel: data.pricingModel,
    riskReversalStyle: data.riskReversalStyle,
    ctaGoal: data.ctaGoal,
    funnelEntryPoint: data.funnelEntryPoint ?? null,
    funnelNextStep: data.funnelNextStep ?? null,
    status: data.status ?? "draft",
    visibility: data.visibility ?? "internal_only",
    strategyWhyConvertJson: data.strategyWhyConvert ?? defaults.strategyWhyConvert,
    perceivedOutcomeReviewJson: data.perceivedOutcomeReview ?? defaults.perceivedOutcomeReview,
    funnelAlignmentJson: data.funnelAlignment ?? defaults.funnelAlignment,
    copyBlocksJson: data.copyBlocks ?? {},
    scoreCacheJson: null,
    warningsJson: null,
    pricingPackageJson: (data.pricingPackage ?? null) as AscendraPricingPackage | null,
    updatedAt: new Date(),
  };
}

export async function createOfferTemplate(data: OfferWrite): Promise<OfferEngineOfferTemplateRow | null> {
  const persona = await getMarketingPersona(data.personaId);
  if (!persona) return null;
  if (await getOfferTemplateBySlug(data.slug.trim().toLowerCase())) return null;

  const base = offerWriteToRowValues(data, {
    strategyWhyConvert: defaultStrategyWhyConvert(),
    perceivedOutcomeReview: defaultPerceivedOutcomeReview(),
    funnelAlignment: defaultFunnelAlignment(),
  });

  const [inserted] = await db.insert(offerEngineOfferTemplates).values(base).returning();
  let row = inserted;
  if (inserted.pricingPackageJson) {
    const refreshed = refreshPricingPackageComputed(
      inserted,
      ensurePricingPackage(inserted.pricingPackageJson as AscendraPricingPackage),
    );
    const [withPkg] = await db
      .update(offerEngineOfferTemplates)
      .set({ pricingPackageJson: refreshed, updatedAt: new Date() })
      .where(eq(offerEngineOfferTemplates.id, inserted.id))
      .returning();
    if (withPkg) row = withPkg;
  }
  const patch = recomputeOfferPatch(row);
  const [final] = await db
    .update(offerEngineOfferTemplates)
    .set(patch)
    .where(eq(offerEngineOfferTemplates.id, row.id))
    .returning();
  return final ?? row;
}

export async function updateOfferTemplate(
  id: number,
  patch: Partial<OfferWrite> & Record<string, unknown>,
): Promise<OfferEngineOfferTemplateRow | null> {
  const existing = await getOfferTemplate(id);
  if (!existing) return null;

  const next: OfferEngineOfferTemplateRow = {
    ...existing,
    ...(patch.name !== undefined ? { name: String(patch.name) } : {}),
    ...(patch.slug !== undefined ? { slug: String(patch.slug).trim().toLowerCase() } : {}),
    ...(patch.personaId !== undefined ? { personaId: String(patch.personaId) } : {}),
    ...(patch.industryNiche !== undefined ? { industryNiche: patch.industryNiche as string | null } : {}),
    ...(patch.offerType !== undefined ? { offerType: patch.offerType as string } : {}),
    ...(patch.buyerAwareness !== undefined ? { buyerAwareness: patch.buyerAwareness as string } : {}),
    ...(patch.coreProblem !== undefined ? { coreProblem: patch.coreProblem as string | null } : {}),
    ...(patch.desiredOutcome !== undefined ? { desiredOutcome: patch.desiredOutcome as string | null } : {}),
    ...(patch.emotionalDrivers !== undefined
      ? { emotionalDriversJson: patch.emotionalDrivers as string[] }
      : {}),
    ...(patch.primaryPromise !== undefined ? { primaryPromise: patch.primaryPromise as string | null } : {}),
    ...(patch.tangibleDeliverables !== undefined
      ? { tangibleDeliverables: patch.tangibleDeliverables as string | null }
      : {}),
    ...(patch.timeToFirstWin !== undefined ? { timeToFirstWin: patch.timeToFirstWin as string | null } : {}),
    ...(patch.trustBuilderType !== undefined ? { trustBuilderType: patch.trustBuilderType as string } : {}),
    ...(patch.pricingModel !== undefined ? { pricingModel: patch.pricingModel as string } : {}),
    ...(patch.riskReversalStyle !== undefined ? { riskReversalStyle: patch.riskReversalStyle as string } : {}),
    ...(patch.ctaGoal !== undefined ? { ctaGoal: patch.ctaGoal as string } : {}),
    ...(patch.funnelEntryPoint !== undefined ? { funnelEntryPoint: patch.funnelEntryPoint as string | null } : {}),
    ...(patch.funnelNextStep !== undefined ? { funnelNextStep: patch.funnelNextStep as string | null } : {}),
    ...(patch.status !== undefined ? { status: patch.status as string } : {}),
    ...(patch.visibility !== undefined ? { visibility: patch.visibility as string } : {}),
    ...(patch.strategyWhyConvert !== undefined
      ? { strategyWhyConvertJson: patch.strategyWhyConvert as typeof existing.strategyWhyConvertJson }
      : {}),
    ...(patch.perceivedOutcomeReview !== undefined
      ? { perceivedOutcomeReviewJson: patch.perceivedOutcomeReview as typeof existing.perceivedOutcomeReviewJson }
      : {}),
    ...(patch.funnelAlignment !== undefined
      ? { funnelAlignmentJson: patch.funnelAlignment as typeof existing.funnelAlignmentJson }
      : {}),
    ...(patch.copyBlocks !== undefined ? { copyBlocksJson: patch.copyBlocks as typeof existing.copyBlocksJson } : {}),
  };

  let pricingPackageJson: AscendraPricingPackage | null = next.pricingPackageJson ?? null;
  if (patch.pricingPackage !== undefined) {
    pricingPackageJson =
      patch.pricingPackage === null ? null : (patch.pricingPackage as AscendraPricingPackage);
  }
  let merged: OfferEngineOfferTemplateRow = { ...next, pricingPackageJson };
  if (merged.pricingPackageJson) {
    const refreshed = refreshPricingPackageComputed(merged, ensurePricingPackage(merged.pricingPackageJson));
    merged = { ...merged, pricingPackageJson: refreshed };
  }

  if (patch.personaId) {
    const p = await getMarketingPersona(merged.personaId);
    if (!p) return null;
  }

  const re = recomputeOfferPatch(merged);
  await db
    .update(offerEngineOfferTemplates)
    .set({
      ...merged,
      scoreCacheJson: re.scoreCacheJson,
      warningsJson: re.warningsJson,
      updatedAt: new Date(),
    })
    .where(eq(offerEngineOfferTemplates.id, id));

  return getOfferTemplate(id);
}

export async function duplicateOfferTemplate(id: number): Promise<OfferEngineOfferTemplateRow | null> {
  const src = await getOfferTemplate(id);
  if (!src) return null;
  let slug = `${src.slug}-copy`;
  let n = 2;
  while (await getOfferTemplateBySlug(slug)) {
    slug = `${src.slug}-copy-${n++}`;
  }
  const insertPayload: InsertOfferEngineOfferTemplateRow = {
    slug,
    name: `${src.name} (copy)`,
    personaId: src.personaId,
    industryNiche: src.industryNiche,
    offerType: src.offerType,
    buyerAwareness: src.buyerAwareness,
    coreProblem: src.coreProblem,
    desiredOutcome: src.desiredOutcome,
    emotionalDriversJson: src.emotionalDriversJson,
    primaryPromise: src.primaryPromise,
    tangibleDeliverables: src.tangibleDeliverables,
    timeToFirstWin: src.timeToFirstWin,
    trustBuilderType: src.trustBuilderType,
    pricingModel: src.pricingModel,
    riskReversalStyle: src.riskReversalStyle,
    ctaGoal: src.ctaGoal,
    funnelEntryPoint: src.funnelEntryPoint,
    funnelNextStep: src.funnelNextStep,
    status: "draft",
    visibility: src.visibility,
    strategyWhyConvertJson: { ...src.strategyWhyConvertJson },
    perceivedOutcomeReviewJson: { ...src.perceivedOutcomeReviewJson },
    funnelAlignmentJson: { ...src.funnelAlignmentJson },
    copyBlocksJson: { ...src.copyBlocksJson },
    scoreCacheJson: null,
    warningsJson: null,
    pricingPackageJson: src.pricingPackageJson
      ? (JSON.parse(JSON.stringify(src.pricingPackageJson)) as AscendraPricingPackage)
      : null,
    updatedAt: new Date(),
  };
  const [inserted] = await db.insert(offerEngineOfferTemplates).values(insertPayload).returning();
  let row = inserted;
  if (inserted.pricingPackageJson) {
    const refreshed = refreshPricingPackageComputed(
      inserted,
      ensurePricingPackage(inserted.pricingPackageJson as AscendraPricingPackage),
    );
    const [withPkg] = await db
      .update(offerEngineOfferTemplates)
      .set({ pricingPackageJson: refreshed, updatedAt: new Date() })
      .where(eq(offerEngineOfferTemplates.id, inserted.id))
      .returning();
    if (withPkg) row = withPkg;
  }
  const patch = recomputeOfferPatch(row);
  const [out] = await db
    .update(offerEngineOfferTemplates)
    .set(patch)
    .where(eq(offerEngineOfferTemplates.id, row.id))
    .returning();
  return out ?? row;
}

export async function deleteOfferTemplate(id: number): Promise<boolean> {
  const r = await db.delete(offerEngineOfferTemplates).where(eq(offerEngineOfferTemplates.id, id)).returning();
  return r.length > 0;
}

export async function listLeadMagnetTemplates(filters?: {
  personaId?: string;
  status?: string;
  minScore?: number;
  q?: string;
}): Promise<OfferEngineLeadMagnetTemplateRow[]> {
  const rows = await db
    .select()
    .from(offerEngineLeadMagnetTemplates)
    .orderBy(desc(offerEngineLeadMagnetTemplates.updatedAt));
  return rows.filter((r) => {
    if (filters?.personaId && r.personaId !== filters.personaId) return false;
    if (filters?.status && r.status !== filters.status) return false;
    if (filters?.minScore != null && (r.scoreCacheJson?.overall ?? 0) < filters.minScore) return false;
    if (filters?.q) {
      const qq = filters.q.toLowerCase();
      if (!r.name.toLowerCase().includes(qq) && !r.slug.toLowerCase().includes(qq)) return false;
    }
    return true;
  });
}

export async function getLeadMagnetTemplate(id: number): Promise<OfferEngineLeadMagnetTemplateRow | null> {
  const [r] = await db
    .select()
    .from(offerEngineLeadMagnetTemplates)
    .where(eq(offerEngineLeadMagnetTemplates.id, id))
    .limit(1);
  return r ?? null;
}

async function getLmBySlug(slug: string): Promise<OfferEngineLeadMagnetTemplateRow | null> {
  const [r] = await db
    .select()
    .from(offerEngineLeadMagnetTemplates)
    .where(eq(offerEngineLeadMagnetTemplates.slug, slug))
    .limit(1);
  return r ?? null;
}

export async function createLeadMagnetTemplate(data: LeadMagnetWrite): Promise<OfferEngineLeadMagnetTemplateRow | null> {
  const persona = await getMarketingPersona(data.personaId);
  if (!persona) return null;
  if (data.relatedOfferTemplateId) {
    const o = await getOfferTemplate(data.relatedOfferTemplateId);
    if (!o) return null;
  }
  const slug = data.slug.trim().toLowerCase();
  if (await getLmBySlug(slug)) return null;

  const base = {
    slug,
    name: data.name.trim(),
    personaId: data.personaId.trim(),
    relatedOfferTemplateId: data.relatedOfferTemplateId ?? null,
    funnelStage: data.funnelStage,
    leadMagnetType: data.leadMagnetType,
    bigProblem: data.bigProblem ?? null,
    smallQuickWin: data.smallQuickWin ?? null,
    format: data.format,
    promiseHook: data.promiseHook ?? null,
    ctaAfterConsumption: data.ctaAfterConsumption ?? null,
    deliveryMethod: data.deliveryMethod,
    trustPurpose: data.trustPurpose,
    qualificationIntent: data.qualificationIntent,
    status: data.status ?? "draft",
    visibility: data.visibility ?? "internal_only",
    bridgeToPaidJson: data.bridgeToPaid ?? defaultBridgeToPaid(),
    perceivedOutcomeReviewJson: data.perceivedOutcomeReview ?? defaultPerceivedOutcomeReview(),
    funnelAlignmentJson: data.funnelAlignment ?? defaultFunnelAlignment(),
    copyBlocksJson: data.copyBlocks ?? {},
    scoreCacheJson: null,
    warningsJson: null,
    updatedAt: new Date(),
  };

  const [inserted] = await db.insert(offerEngineLeadMagnetTemplates).values(base).returning();
  const re = recomputeLmRow(inserted);
  const [final] = await db
    .update(offerEngineLeadMagnetTemplates)
    .set(re)
    .where(eq(offerEngineLeadMagnetTemplates.id, inserted.id))
    .returning();
  return final ?? inserted;
}

export async function updateLeadMagnetTemplate(
  id: number,
  patch: Partial<LeadMagnetWrite> & Record<string, unknown>,
): Promise<OfferEngineLeadMagnetTemplateRow | null> {
  const existing = await getLeadMagnetTemplate(id);
  if (!existing) return null;
  const next: OfferEngineLeadMagnetTemplateRow = {
    ...existing,
    ...(patch.name !== undefined ? { name: String(patch.name) } : {}),
    ...(patch.slug !== undefined ? { slug: String(patch.slug).trim().toLowerCase() } : {}),
    ...(patch.personaId !== undefined ? { personaId: String(patch.personaId) } : {}),
    ...(patch.relatedOfferTemplateId !== undefined
      ? { relatedOfferTemplateId: patch.relatedOfferTemplateId as number | null }
      : {}),
    ...(patch.funnelStage !== undefined ? { funnelStage: patch.funnelStage as string } : {}),
    ...(patch.leadMagnetType !== undefined ? { leadMagnetType: patch.leadMagnetType as string } : {}),
    ...(patch.bigProblem !== undefined ? { bigProblem: patch.bigProblem as string | null } : {}),
    ...(patch.smallQuickWin !== undefined ? { smallQuickWin: patch.smallQuickWin as string | null } : {}),
    ...(patch.format !== undefined ? { format: patch.format as string } : {}),
    ...(patch.promiseHook !== undefined ? { promiseHook: patch.promiseHook as string | null } : {}),
    ...(patch.ctaAfterConsumption !== undefined
      ? { ctaAfterConsumption: patch.ctaAfterConsumption as string | null }
      : {}),
    ...(patch.deliveryMethod !== undefined ? { deliveryMethod: patch.deliveryMethod as string } : {}),
    ...(patch.trustPurpose !== undefined ? { trustPurpose: patch.trustPurpose as string } : {}),
    ...(patch.qualificationIntent !== undefined ? { qualificationIntent: patch.qualificationIntent as string } : {}),
    ...(patch.status !== undefined ? { status: patch.status as string } : {}),
    ...(patch.visibility !== undefined ? { visibility: patch.visibility as string } : {}),
    ...(patch.bridgeToPaid !== undefined
      ? { bridgeToPaidJson: patch.bridgeToPaid as typeof existing.bridgeToPaidJson }
      : {}),
    ...(patch.perceivedOutcomeReview !== undefined
      ? { perceivedOutcomeReviewJson: patch.perceivedOutcomeReview as typeof existing.perceivedOutcomeReviewJson }
      : {}),
    ...(patch.funnelAlignment !== undefined
      ? { funnelAlignmentJson: patch.funnelAlignment as typeof existing.funnelAlignmentJson }
      : {}),
    ...(patch.copyBlocks !== undefined ? { copyBlocksJson: patch.copyBlocks as typeof existing.copyBlocksJson } : {}),
  };

  if (patch.personaId) {
    const p = await getMarketingPersona(next.personaId);
    if (!p) return null;
  }
  if (patch.relatedOfferTemplateId !== undefined && next.relatedOfferTemplateId) {
    const o = await getOfferTemplate(next.relatedOfferTemplateId);
    if (!o) return null;
  }

  const re = recomputeLmRow(next);
  await db
    .update(offerEngineLeadMagnetTemplates)
    .set({ ...next, ...re })
    .where(eq(offerEngineLeadMagnetTemplates.id, id));

  return getLeadMagnetTemplate(id);
}

export async function duplicateLeadMagnetTemplate(id: number): Promise<OfferEngineLeadMagnetTemplateRow | null> {
  const src = await getLeadMagnetTemplate(id);
  if (!src) return null;
  let slug = `${src.slug}-copy`;
  let n = 2;
  while (await getLmBySlug(slug)) {
    slug = `${src.slug}-copy-${n++}`;
  }
  const { id: _i, createdAt: _c, ...rest } = src;
  const [inserted] = await db
    .insert(offerEngineLeadMagnetTemplates)
    .values({
      ...rest,
      slug,
      name: `${src.name} (copy)`,
      status: "draft",
      scoreCacheJson: null,
      warningsJson: null,
      updatedAt: new Date(),
    })
    .returning();
  const re = recomputeLmRow(inserted);
  const [out] = await db
    .update(offerEngineLeadMagnetTemplates)
    .set(re)
    .where(eq(offerEngineLeadMagnetTemplates.id, inserted.id))
    .returning();
  return out ?? inserted;
}

export async function deleteLeadMagnetTemplate(id: number): Promise<boolean> {
  const r = await db
    .delete(offerEngineLeadMagnetTemplates)
    .where(eq(offerEngineLeadMagnetTemplates.id, id))
    .returning();
  return r.length > 0;
}

export async function updatePersonaStrategyLayer(
  personaId: string,
  layer: PersonaStrategyLayer,
): Promise<MarketingPersonaDTO | null> {
  const parsed = personaStrategyLayerSchema.safeParse(layer);
  if (!parsed.success) return null;
  const existing = await getMarketingPersona(personaId);
  if (!existing) return null;
  await db
    .update(marketingPersonas)
    .set({ offerEngineStrategyJson: parsed.data, updatedAt: new Date() })
    .where(eq(marketingPersonas.id, personaId));
  return getMarketingPersona(personaId);
}

export async function listFunnelPaths(personaId?: string) {
  const rows = await db.select().from(offerEngineFunnelPaths).orderBy(desc(offerEngineFunnelPaths.updatedAt));
  if (!personaId) return rows;
  return rows.filter((r) => r.personaId === personaId);
}

export async function upsertFunnelPath(data: FunnelPathWrite) {
  const persona = await getMarketingPersona(data.personaId);
  if (!persona) return null;
  if (data.primaryOfferTemplateId) {
    const o = await getOfferTemplate(data.primaryOfferTemplateId);
    if (!o) return null;
  }
  if (data.primaryLeadMagnetTemplateId) {
    const l = await getLeadMagnetTemplate(data.primaryLeadMagnetTemplateId);
    if (!l) return null;
  }
  const slug = data.slug.trim().toLowerCase();
  const values = {
    slug,
    label: data.label.trim(),
    personaId: data.personaId.trim(),
    stepsJson: data.steps,
    primaryOfferTemplateId: data.primaryOfferTemplateId ?? null,
    primaryLeadMagnetTemplateId: data.primaryLeadMagnetTemplateId ?? null,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(offerEngineFunnelPaths)
    .values(values)
    .onConflictDoUpdate({
      target: offerEngineFunnelPaths.slug,
      set: {
        label: values.label,
        personaId: values.personaId,
        stepsJson: values.stepsJson,
        primaryOfferTemplateId: values.primaryOfferTemplateId,
        primaryLeadMagnetTemplateId: values.primaryLeadMagnetTemplateId,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row ?? null;
}

export async function regenerateOfferCopy(id: number): Promise<OfferEngineOfferTemplateRow | null> {
  const row = await getOfferTemplate(id);
  if (!row) return null;
  const persona = await getMarketingPersona(row.personaId);
  if (!persona) return null;
  const blocks = generateOfferCopyBlocks(persona, row, persona.offerEngineStrategy);
  return updateOfferTemplate(id, { copyBlocks: blocks } as Partial<OfferWrite>);
}

export async function regenerateLeadMagnetCopy(id: number): Promise<OfferEngineLeadMagnetTemplateRow | null> {
  const row = await getLeadMagnetTemplate(id);
  if (!row) return null;
  const persona = await getMarketingPersona(row.personaId);
  if (!persona) return null;
  const blocks = generateLeadMagnetCopyBlocks(persona, row, persona.offerEngineStrategy);
  return updateLeadMagnetTemplate(id, { copyBlocks: blocks } as Partial<LeadMagnetWrite>);
}

export async function offerEngineSummary() {
  const [o] = await db.select({ n: sql<number>`count(*)::int` }).from(offerEngineOfferTemplates);
  const [l] = await db.select({ n: sql<number>`count(*)::int` }).from(offerEngineLeadMagnetTemplates);
  const [f] = await db.select({ n: sql<number>`count(*)::int` }).from(offerEngineFunnelPaths);
  const personas = await listMarketingPersonas();
  return {
    offerTemplateCount: Number(o?.n ?? 0),
    leadMagnetTemplateCount: Number(l?.n ?? 0),
    funnelPathCount: Number(f?.n ?? 0),
    personaCount: personas.length,
  };
}

export async function listAnalyticsMetricDefinitions() {
  return db.select().from(offerEngineAnalyticsMetricDefinitions).orderBy(offerEngineAnalyticsMetricDefinitions.metricKey);
}

export async function ensureAnalyticsMetricSeeds() {
  const seeds = [
    { metricKey: "impressions", description: "Planned: surface impressions for an asset.", appliesTo: "both", valueType: "count" },
    { metricKey: "clicks", description: "Planned: CTA or link clicks.", appliesTo: "both", valueType: "count" },
    { metricKey: "opt_ins", description: "Planned: form or opt-in completions.", appliesTo: "lead_magnet", valueType: "count" },
    { metricKey: "booked_calls", description: "Planned: strategy calls booked from this asset.", appliesTo: "both", valueType: "count" },
    { metricKey: "conversions", description: "Planned: revenue events or closed-won tied to asset.", appliesTo: "offer", valueType: "count" },
    { metricKey: "conversion_rate", description: "Planned: conversions / qualified traffic.", appliesTo: "both", valueType: "rate" },
    { metricKey: "cost_per_lead", description: "Planned: spend / leads (when ad source linked).", appliesTo: "both", valueType: "currency" },
    { metricKey: "lead_quality_feedback", description: "Planned: CRM or sales qualitative score.", appliesTo: "lead_magnet", valueType: "score" },
    { metricKey: "offer_close_rate", description: "Planned: closes / qualified opportunities for offer.", appliesTo: "offer", valueType: "rate" },
    { metricKey: "lead_magnet_assist_rate", description: "Planned: assists where magnet preceded closed deal.", appliesTo: "lead_magnet", valueType: "rate" },
    { metricKey: "persona_level_performance", description: "Planned: rollups by persona_id.", appliesTo: "both", valueType: "ratio" },
    { metricKey: "cta_level_performance", description: "Planned: per-CTA variant metrics.", appliesTo: "both", valueType: "ratio" },
  ] as const;
  for (const s of seeds) {
    await db
      .insert(offerEngineAnalyticsMetricDefinitions)
      .values(s)
      .onConflictDoNothing({ target: offerEngineAnalyticsMetricDefinitions.metricKey });
  }
}

/**
 * Compatibility export consumed by `/api/admin/offer-engine/summary`.
 * Aggregates intelligence sections from the dedicated intelligence service.
 */
export async function buildOfferEngineIntelligence() {
  const [relationship, grading, readiness] = await Promise.all([
    buildOfferEngineRelationshipInsights(),
    buildOfferAndLeadMagnetGradingRows(),
    getOfferEngineReadinessAlerts(),
  ]);
  return {
    relationship,
    grading,
    readiness,
  };
}
