import { db } from "../db";
import { eq, desc, count } from "drizzle-orm";
import {
  marketingPersonas,
  ascendraScriptTemplates,
  ascendraLeadMagnets,
  type MarketingPersonaRow,
  type AscendraScriptTemplateRow,
  type AscendraLeadMagnetRow,
  SCRIPT_TEMPLATE_CATEGORIES,
  LEAD_MAGNET_TYPES,
  type ScriptTemplateCategory,
  type LeadMagnetType,
} from "@shared/schema";

export type MarketingPersonaDTO = {
  id: string;
  displayName: string;
  segment: string | null;
  revenueBand: string | null;
  summary: string | null;
  strategicNote: string | null;
  problems: string[];
  goals: string[];
  objections: string[];
  dynamicSignals: string[];
  updatedAt: string;
};

function rowToPersona(r: MarketingPersonaRow): MarketingPersonaDTO {
  return {
    id: r.id,
    displayName: r.displayName,
    segment: r.segment ?? null,
    revenueBand: r.revenueBand ?? null,
    summary: r.summary ?? null,
    strategicNote: r.strategicNote ?? null,
    problems: r.problemsJson ?? [],
    goals: r.goalsJson ?? [],
    objections: r.objectionsJson ?? [],
    dynamicSignals: r.dynamicSignalsJson ?? [],
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listMarketingPersonas(): Promise<MarketingPersonaDTO[]> {
  const rows = await db.select().from(marketingPersonas).orderBy(marketingPersonas.id);
  return rows.map(rowToPersona);
}

export async function getMarketingPersona(id: string): Promise<MarketingPersonaDTO | null> {
  const [r] = await db.select().from(marketingPersonas).where(eq(marketingPersonas.id, id)).limit(1);
  return r ? rowToPersona(r) : null;
}

export async function createMarketingPersona(data: {
  id: string;
  displayName: string;
  /** Omitted or undefined → SQL NULL (call sites should coerce Zod `null` away with `?? undefined`). */
  segment?: string;
  revenueBand?: string;
  summary?: string;
  strategicNote?: string;
  problems?: string[];
  goals?: string[];
  objections?: string[];
  dynamicSignals?: string[];
}): Promise<MarketingPersonaDTO | null> {
  const id = data.id.trim().toLowerCase();
  if (!id) return null;
  const taken = await getMarketingPersona(id);
  if (taken) return null;

  await db.insert(marketingPersonas).values({
    id,
    displayName: data.displayName.trim(),
    segment: data.segment ?? null,
    revenueBand: data.revenueBand ?? null,
    summary: data.summary ?? null,
    strategicNote: data.strategicNote ?? null,
    problemsJson: data.problems ?? [],
    goalsJson: data.goals ?? [],
    objectionsJson: data.objections ?? [],
    dynamicSignalsJson: data.dynamicSignals ?? [],
    updatedAt: new Date(),
  });

  return getMarketingPersona(id);
}

export async function updateMarketingPersona(
  id: string,
  patch: Partial<{
    displayName: string;
    segment: string | null;
    revenueBand: string | null;
    summary: string | null;
    strategicNote: string | null;
    problems: string[];
    goals: string[];
    objections: string[];
    dynamicSignals: string[];
  }>,
): Promise<MarketingPersonaDTO | null> {
  const existing = await getMarketingPersona(id);
  if (!existing) return null;

  await db
    .update(marketingPersonas)
    .set({
      ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
      ...(patch.segment !== undefined ? { segment: patch.segment } : {}),
      ...(patch.revenueBand !== undefined ? { revenueBand: patch.revenueBand } : {}),
      ...(patch.summary !== undefined ? { summary: patch.summary } : {}),
      ...(patch.strategicNote !== undefined ? { strategicNote: patch.strategicNote } : {}),
      ...(patch.problems !== undefined ? { problemsJson: patch.problems } : {}),
      ...(patch.goals !== undefined ? { goalsJson: patch.goals } : {}),
      ...(patch.objections !== undefined ? { objectionsJson: patch.objections } : {}),
      ...(patch.dynamicSignals !== undefined ? { dynamicSignalsJson: patch.dynamicSignals } : {}),
      updatedAt: new Date(),
    })
    .where(eq(marketingPersonas.id, id));

  return getMarketingPersona(id);
}

export type ScriptTemplateDTO = {
  id: number;
  personaId: string;
  category: ScriptTemplateCategory;
  name: string;
  bodyMd: string;
  variables: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

function rowToScript(r: AscendraScriptTemplateRow): ScriptTemplateDTO {
  const cat = SCRIPT_TEMPLATE_CATEGORIES.includes(r.category as ScriptTemplateCategory)
    ? (r.category as ScriptTemplateCategory)
    : "warm";
  return {
    id: r.id,
    personaId: r.personaId,
    category: cat,
    name: r.name,
    bodyMd: r.bodyMd,
    variables: r.variablesJson ?? [],
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listScriptTemplates(personaId?: string): Promise<ScriptTemplateDTO[]> {
  const rows = personaId
    ? await db
        .select()
        .from(ascendraScriptTemplates)
        .where(eq(ascendraScriptTemplates.personaId, personaId))
        .orderBy(desc(ascendraScriptTemplates.updatedAt))
    : await db.select().from(ascendraScriptTemplates).orderBy(desc(ascendraScriptTemplates.updatedAt));
  return rows.map(rowToScript);
}

export async function getScriptTemplate(id: number): Promise<ScriptTemplateDTO | null> {
  const [r] = await db
    .select()
    .from(ascendraScriptTemplates)
    .where(eq(ascendraScriptTemplates.id, id))
    .limit(1);
  return r ? rowToScript(r) : null;
}

export async function createScriptTemplate(data: {
  personaId: string;
  category: string;
  name: string;
  bodyMd?: string;
  variables?: string[];
  status?: string;
}): Promise<ScriptTemplateDTO> {
  const category = SCRIPT_TEMPLATE_CATEGORIES.includes(data.category as ScriptTemplateCategory)
    ? data.category
    : "warm";
  const [r] = await db
    .insert(ascendraScriptTemplates)
    .values({
      personaId: data.personaId,
      category,
      name: data.name,
      bodyMd: data.bodyMd ?? "",
      variablesJson: data.variables ?? [],
      status: data.status ?? "draft",
      updatedAt: new Date(),
    })
    .returning();
  return rowToScript(r);
}

export async function updateScriptTemplate(
  id: number,
  patch: Partial<{
    personaId: string;
    category: string;
    name: string;
    bodyMd: string;
    variables: string[];
    status: string;
  }>,
): Promise<ScriptTemplateDTO | null> {
  const existing = await getScriptTemplate(id);
  if (!existing) return null;

  const category =
    patch.category !== undefined && SCRIPT_TEMPLATE_CATEGORIES.includes(patch.category as ScriptTemplateCategory)
      ? patch.category
      : undefined;

  await db
    .update(ascendraScriptTemplates)
    .set({
      ...(patch.personaId !== undefined ? { personaId: patch.personaId } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.bodyMd !== undefined ? { bodyMd: patch.bodyMd } : {}),
      ...(patch.variables !== undefined ? { variablesJson: patch.variables } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      updatedAt: new Date(),
    })
    .where(eq(ascendraScriptTemplates.id, id));

  return getScriptTemplate(id);
}

export async function deleteScriptTemplate(id: number): Promise<boolean> {
  const r = await db.delete(ascendraScriptTemplates).where(eq(ascendraScriptTemplates.id, id)).returning();
  return r.length > 0;
}

export type LeadMagnetDTO = {
  id: number;
  magnetType: LeadMagnetType;
  title: string;
  hook: string | null;
  bodyMd: string | null;
  primaryAssetId: number | null;
  personaIds: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

function rowToMagnet(r: AscendraLeadMagnetRow): LeadMagnetDTO {
  const t = LEAD_MAGNET_TYPES.includes(r.magnetType as LeadMagnetType)
    ? (r.magnetType as LeadMagnetType)
    : "reveal_problems";
  return {
    id: r.id,
    magnetType: t,
    title: r.title,
    hook: r.hook ?? null,
    bodyMd: r.bodyMd ?? null,
    primaryAssetId: r.primaryAssetId ?? null,
    personaIds: r.personaIdsJson ?? [],
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listLeadMagnets(): Promise<LeadMagnetDTO[]> {
  const rows = await db.select().from(ascendraLeadMagnets).orderBy(desc(ascendraLeadMagnets.updatedAt));
  return rows.map(rowToMagnet);
}

export async function getLeadMagnet(id: number): Promise<LeadMagnetDTO | null> {
  const [r] = await db.select().from(ascendraLeadMagnets).where(eq(ascendraLeadMagnets.id, id)).limit(1);
  return r ? rowToMagnet(r) : null;
}

export async function createLeadMagnet(data: {
  magnetType: string;
  title: string;
  /** Omitted or undefined → SQL NULL (API routes: `hook: d.hook ?? undefined`). */
  hook?: string;
  bodyMd?: string;
  primaryAssetId?: number;
  personaIds?: string[];
  status?: string;
}): Promise<LeadMagnetDTO> {
  const magnetType = LEAD_MAGNET_TYPES.includes(data.magnetType as LeadMagnetType)
    ? data.magnetType
    : "reveal_problems";
  const [r] = await db
    .insert(ascendraLeadMagnets)
    .values({
      magnetType,
      title: data.title,
      hook: data.hook ?? null,
      bodyMd: data.bodyMd ?? null,
      primaryAssetId: data.primaryAssetId ?? null,
      personaIdsJson: data.personaIds ?? [],
      status: data.status ?? "draft",
      updatedAt: new Date(),
    })
    .returning();
  return rowToMagnet(r);
}

export async function updateLeadMagnet(
  id: number,
  patch: Partial<{
    magnetType: string;
    title: string;
    hook: string | null;
    bodyMd: string | null;
    primaryAssetId: number | null;
    personaIds: string[];
    status: string;
  }>,
): Promise<LeadMagnetDTO | null> {
  const existing = await getLeadMagnet(id);
  if (!existing) return null;

  const magnetType =
    patch.magnetType !== undefined && LEAD_MAGNET_TYPES.includes(patch.magnetType as LeadMagnetType)
      ? patch.magnetType
      : undefined;

  await db
    .update(ascendraLeadMagnets)
    .set({
      ...(magnetType !== undefined ? { magnetType } : {}),
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.hook !== undefined ? { hook: patch.hook } : {}),
      ...(patch.bodyMd !== undefined ? { bodyMd: patch.bodyMd } : {}),
      ...(patch.primaryAssetId !== undefined ? { primaryAssetId: patch.primaryAssetId } : {}),
      ...(patch.personaIds !== undefined ? { personaIdsJson: patch.personaIds } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      updatedAt: new Date(),
    })
    .where(eq(ascendraLeadMagnets.id, id));

  return getLeadMagnet(id);
}

export async function deleteLeadMagnet(id: number): Promise<boolean> {
  const r = await db.delete(ascendraLeadMagnets).where(eq(ascendraLeadMagnets.id, id)).returning();
  return r.length > 0;
}

export async function countScripts(): Promise<number> {
  const [r] = await db.select({ n: count() }).from(ascendraScriptTemplates);
  return Number(r?.n ?? 0);
}

export async function countLeadMagnets(): Promise<number> {
  const [r] = await db.select({ n: count() }).from(ascendraLeadMagnets);
  return Number(r?.n ?? 0);
}
