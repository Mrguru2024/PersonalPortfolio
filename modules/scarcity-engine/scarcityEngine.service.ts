import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@server/db";
import {
  crmContacts,
  growthFunnelLeads,
  ppcCampaigns,
  scarcityEngineConfigs,
  type ScarcityEngineConfigRow,
  type ScarcityStatus,
} from "@shared/schema";
import {
  calculateAvailableSlots,
  evaluateCycleWindow,
  evaluatePerformanceGate,
  formatScarcityMessage,
  getStatusFromUsage,
} from "./scarcityEngine.utils";
import type {
  DynamicScarcityDisplay,
  DynamicScarcityInput,
  LeadScarcityMeta,
  ScarcityEvaluationContext,
  ScarcityEvaluationResult,
  ScarcityQueryScope,
} from "./scarcityEngine.types";

function matchesScopeConfig(config: ScarcityEngineConfigRow, scope: ScarcityQueryScope): boolean {
  if (!config.isActive) return false;
  if (config.personaLimit && scope.personaId && config.personaLimit !== scope.personaId) return false;
  if (config.offerLimit && scope.offerSlug && normalizeSlug(config.offerLimit) !== scope.offerSlug) return false;
  if (config.leadMagnetLimit && scope.leadMagnetSlug && normalizeSlug(config.leadMagnetLimit) !== scope.leadMagnetSlug) {
    return false;
  }
  if (config.funnelLimit && scope.funnelSlug && normalizeSlug(config.funnelLimit) !== scope.funnelSlug) return false;
  return true;
}

function normalizeSlug(input?: string | null): string | undefined {
  if (typeof input !== "string") return undefined;
  const value = input.trim().toLowerCase();
  return value || undefined;
}

function normalizeText(input?: string | null): string | undefined {
  if (typeof input !== "string") return undefined;
  const value = input.trim();
  return value || undefined;
}

function toDate(value?: Date | string | null): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function mapScopeFromConfig(config: ScarcityEngineConfigRow): ScarcityQueryScope {
  return {
    personaId: config.personaLimit ?? undefined,
    offerSlug: normalizeSlug(config.offerLimit),
    leadMagnetSlug: normalizeSlug(config.leadMagnetLimit),
    funnelSlug: normalizeSlug(config.funnelLimit),
  };
}

function mergeScope(primary: ScarcityQueryScope, override: ScarcityQueryScope): ScarcityQueryScope {
  return {
    personaId: override.personaId ?? primary.personaId,
    offerSlug: override.offerSlug ?? primary.offerSlug,
    leadMagnetSlug: override.leadMagnetSlug ?? primary.leadMagnetSlug,
    funnelSlug: override.funnelSlug ?? primary.funnelSlug,
  };
}

async function countUsedSlots(scope: ScarcityQueryScope): Promise<number> {
  const contactFilters = [
    sql`(
      (${crmContacts.customFields} ->> 'sourceConversionStage') IS NULL
      OR lower(${crmContacts.customFields} ->> 'sourceConversionStage') <> 'waitlist'
    )`,
  ];
  if (scope.offerSlug) {
    contactFilters.push(
      sql`${crmContacts.customFields} ->> 'sourceOfferSlug' = ${scope.offerSlug}`,
    );
  }
  if (scope.leadMagnetSlug) {
    contactFilters.push(
      sql`${crmContacts.customFields} ->> 'sourceLeadMagnetSlug' = ${scope.leadMagnetSlug}`,
    );
  }
  if (scope.funnelSlug) {
    contactFilters.push(
      sql`${crmContacts.customFields} ->> 'sourceFunnelSlug' = ${scope.funnelSlug}`,
    );
  }
  if (scope.personaId) {
    contactFilters.push(sql`${crmContacts.customFields} ->> 'personaId' = ${scope.personaId}`);
  }

  const [crmCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(crmContacts)
    .where(and(...contactFilters));

  const funnelFilters = [];
  if (scope.offerSlug) funnelFilters.push(sql`${growthFunnelLeads.sourceOfferTemplateId} is not null`);
  if (scope.leadMagnetSlug) funnelFilters.push(sql`${growthFunnelLeads.sourceLeadMagnetTemplateId} is not null`);
  if (scope.funnelSlug) funnelFilters.push(eq(growthFunnelLeads.sourceFunnelPathSlug, scope.funnelSlug));
  if (scope.personaId) funnelFilters.push(sql`${growthFunnelLeads.answers} ->> 'personaId' = ${scope.personaId}`);
  funnelFilters.push(
    sql`(${growthFunnelLeads.conversionStage} IS NULL OR lower(${growthFunnelLeads.conversionStage}) <> 'waitlist')`,
  );
  const [funnelCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(growthFunnelLeads)
    .where(and(...funnelFilters));

  return Number(crmCount?.n ?? 0) + Number(funnelCount?.n ?? 0);
}

async function countWaitlist(scope: ScarcityQueryScope): Promise<number> {
  const contactFilters = [];
  if (scope.offerSlug) {
    contactFilters.push(
      sql`${crmContacts.customFields} ->> 'sourceOfferSlug' = ${scope.offerSlug}`,
    );
  }
  if (scope.leadMagnetSlug) {
    contactFilters.push(
      sql`${crmContacts.customFields} ->> 'sourceLeadMagnetSlug' = ${scope.leadMagnetSlug}`,
    );
  }
  if (scope.funnelSlug) {
    contactFilters.push(
      sql`${crmContacts.customFields} ->> 'sourceFunnelSlug' = ${scope.funnelSlug}`,
    );
  }
  if (scope.personaId) {
    contactFilters.push(sql`${crmContacts.customFields} ->> 'personaId' = ${scope.personaId}`);
  }
  contactFilters.push(
    or(
      sql`lower(${crmContacts.customFields} ->> 'sourceConversionStage') = 'waitlist'`,
      ilike(sql`${crmContacts.customFields} ->> 'sourcePathStage'`, "waitlist"),
    )!,
  );
  const [crmCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(crmContacts)
    .where(and(...contactFilters));

  const funnelFilters = [];
  if (scope.funnelSlug) funnelFilters.push(eq(growthFunnelLeads.sourceFunnelPathSlug, scope.funnelSlug));
  funnelFilters.push(or(eq(growthFunnelLeads.conversionStage, "waitlist"), ilike(growthFunnelLeads.qualificationResult, "waitlist"))!);
  const [funnelCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(growthFunnelLeads)
    .where(and(...funnelFilters));

  return Number(crmCount?.n ?? 0) + Number(funnelCount?.n ?? 0);
}

async function computePerformanceMetrics(scope: ScarcityQueryScope): Promise<{
  conversionRate: number;
  avgLeadQuality: number;
  revenueCents: number;
}> {
  const leadFilters = [];
  if (scope.offerSlug) {
    leadFilters.push(
      sql`${crmContacts.customFields} ->> 'sourceOfferSlug' = ${scope.offerSlug}`,
    );
  }
  if (scope.leadMagnetSlug) {
    leadFilters.push(
      sql`${crmContacts.customFields} ->> 'sourceLeadMagnetSlug' = ${scope.leadMagnetSlug}`,
    );
  }
  if (scope.funnelSlug) {
    leadFilters.push(
      sql`${crmContacts.customFields} ->> 'sourceFunnelSlug' = ${scope.funnelSlug}`,
    );
  }
  if (scope.personaId) leadFilters.push(sql`${crmContacts.customFields} ->> 'personaId' = ${scope.personaId}`);

  const leads = await db
    .select({
      id: crmContacts.id,
      leadScore: crmContacts.leadScore,
      stage: crmContacts.lifecycleStage,
    })
    .from(crmContacts)
    .where(and(...leadFilters));

  const leadCount = leads.length;
  const qualified = leads.filter((l) => (l.leadScore ?? 0) >= 65 || l.stage === "qualified" || l.stage === "sales_ready")
    .length;
  const avgLeadQuality =
    leadCount > 0
      ? Math.round(leads.reduce((sum, row) => sum + Number(row.leadScore ?? 0), 0) / Math.max(1, leadCount))
      : 0;

  const conversionRate = leadCount > 0 ? Math.round((qualified / leadCount) * 100) : 0;
  return {
    conversionRate,
    avgLeadQuality,
    revenueCents: 0,
  };
}

function chooseConfig(configs: ScarcityEngineConfigRow[], scope: ScarcityQueryScope): ScarcityEngineConfigRow | null {
  const scored = configs
    .filter((config) => matchesScopeConfig(config, scope))
    .map((config) => ({
      config,
      specificity:
        (config.personaLimit ? 1 : 0) +
        (config.offerLimit ? 1 : 0) +
        (config.leadMagnetLimit ? 1 : 0) +
        (config.funnelLimit ? 1 : 0),
    }))
    .sort((a, b) => b.specificity - a.specificity || b.config.id - a.config.id);
  return scored[0]?.config ?? null;
}

export async function listScarcityConfigs(): Promise<ScarcityEngineConfigRow[]> {
  return db.select().from(scarcityEngineConfigs).orderBy(sql`${scarcityEngineConfigs.updatedAt} desc`);
}

export async function getScarcityConfig(id: number): Promise<ScarcityEngineConfigRow | null> {
  const [row] = await db.select().from(scarcityEngineConfigs).where(eq(scarcityEngineConfigs.id, id)).limit(1);
  return row ?? null;
}

type PpcCampaignGuardRecord = {
  id: number;
  offerSlug: string | null;
  leadMagnetSlug: string | null;
  landingPagePath: string;
};

function inferPpcLeadMagnetSlug(
  campaign: {
    offerSlug: string | null;
    landingPagePath: string;
    trackingParamsJson?: Record<string, unknown> | null;
  },
): string | null {
  const fromTracking =
    typeof campaign.trackingParamsJson?.utm_content === "string"
      ? normalizeSlug(campaign.trackingParamsJson.utm_content)
      : undefined;
  if (fromTracking) return fromTracking;
  // Best-effort fallback: when campaign uses lead-magnet oriented landing paths.
  const lp = campaign.landingPagePath || "";
  if (lp.includes("growth-kit")) return "startup-growth-kit";
  if (lp.includes("audit")) return "digital-growth-audit";
  return null;
}

export async function upsertScarcityConfig(input: import("./scarcityEngine.types").ScarcityConfigWrite): Promise<ScarcityEngineConfigRow> {
  const values = {
    name: input.name.trim(),
    type: input.type,
    maxSlots: Math.max(0, Math.trunc(input.maxSlots)),
    waitlistEnabled: input.waitlistEnabled,
    cycleDurationDays: Math.max(1, Math.trunc(input.cycleDurationDays)),
    cycleStartDate: input.cycleStartDate ?? null,
    personaLimit: normalizeText(input.personaLimit) ?? null,
    offerLimit: normalizeSlug(input.offerLimit) ?? null,
    leadMagnetLimit: normalizeSlug(input.leadMagnetLimit) ?? null,
    funnelLimit: normalizeSlug(input.funnelLimit) ?? null,
    qualificationThreshold: Math.max(0, Math.min(100, Math.trunc(input.qualificationThreshold))),
    performanceThresholdsJson: input.performanceThresholdsJson ?? {},
    isActive: input.isActive,
  };
  if (input.id) {
    const [updated] = await db
      .update(scarcityEngineConfigs)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(scarcityEngineConfigs.id, input.id))
      .returning();
    if (updated) return updated;
  }
  const [created] = await db
    .insert(scarcityEngineConfigs)
    .values({
      ...values,
      currentUsage: 0,
    })
    .returning();
  return created;
}

export async function refreshScarcityUsage(configId: number): Promise<ScarcityEngineConfigRow | null> {
  const config = await getScarcityConfig(configId);
  if (!config) return null;
  const usedSlots = await countUsedSlots(mapScopeFromConfig(config));
  const [updated] = await db
    .update(scarcityEngineConfigs)
    .set({
      currentUsage: usedSlots,
      updatedAt: new Date(),
    })
    .where(eq(scarcityEngineConfigs.id, configId))
    .returning();
  return updated ?? config;
}

export async function evaluateScarcityForContext(
  context: ScarcityEvaluationContext,
): Promise<ScarcityEvaluationResult | null> {
  const allConfigs = await listScarcityConfigs();
  const scopeFromContext: ScarcityQueryScope = {
    personaId: normalizeText(context.personaId),
    offerSlug: normalizeSlug(context.offerSlug),
    leadMagnetSlug: normalizeSlug(context.leadMagnetSlug),
    funnelSlug: normalizeSlug(context.funnelSlug),
  };
  const selected = chooseConfig(allConfigs, scopeFromContext);
  if (!selected || !selected.isActive) return null;

  const scope = mergeScope(mapScopeFromConfig(selected), scopeFromContext);
  const usedSlots = await countUsedSlots(scope);
  const waitlistCount = await countWaitlist(scope);
  const availableSlots = calculateAvailableSlots(selected.maxSlots, usedSlots);
  const baseStatus = getStatusFromUsage(availableSlots, selected.maxSlots);
  const cycle = evaluateCycleWindow(toDate(selected.cycleStartDate), selected.cycleDurationDays);
  const performance = await computePerformanceMetrics(scope);
  const unlockedByPerformance = evaluatePerformanceGate(selected.performanceThresholdsJson ?? {}, performance);
  const qualifiesByLeadScore = (context.leadScore ?? 0) >= selected.qualificationThreshold;

  let status: ScarcityStatus = baseStatus;
  let route: ScarcityEvaluationResult["route"] = "qualified_path";
  let wasWaitlisted = false;

  if (!cycle.isOpen && (selected.type === "cycle" || selected.type === "performance")) {
    status = selected.waitlistEnabled ? "waitlist" : "full";
    route = selected.waitlistEnabled ? "waitlist" : "delayed_intake";
    wasWaitlisted = selected.waitlistEnabled;
  } else if (!qualifiesByLeadScore && selected.type === "access") {
    route = "nurture";
    status = baseStatus === "full" && selected.waitlistEnabled ? "waitlist" : baseStatus;
    wasWaitlisted = status === "waitlist";
  } else if (!unlockedByPerformance && selected.type === "performance") {
    route = "nurture";
    status = baseStatus === "full" && selected.waitlistEnabled ? "waitlist" : baseStatus;
    wasWaitlisted = status === "waitlist";
  } else if (baseStatus === "full") {
    route = selected.waitlistEnabled ? "waitlist" : "delayed_intake";
    status = selected.waitlistEnabled ? "waitlist" : "full";
    wasWaitlisted = selected.waitlistEnabled;
  } else if (baseStatus === "limited") {
    route = "qualified_path";
    status = "limited";
  }

  const displayInput: DynamicScarcityInput = {
    status,
    availableSlots,
    waitlistCount,
    nextCycleDate: cycle.nextCycleDate ? cycle.nextCycleDate.toISOString() : null,
    daysUntilNextCycle: cycle.daysUntilNextCycle,
  };
  const display: DynamicScarcityDisplay = {
    ...displayInput,
    message: formatScarcityMessage(displayInput),
  };

  return {
    configId: selected.id,
    configType: selected.type,
    status,
    availableSlots,
    usedSlots,
    waitlistCount,
    nextCycleDate: cycle.nextCycleDate ? cycle.nextCycleDate.toISOString() : null,
    cycleOpen: cycle.isOpen,
    route,
    qualifiesByLeadScore,
    unlockedByPerformance,
    message: display.message,
    leadMeta: {
      offerSlug: scope.offerSlug ?? null,
      leadMagnetSlug: scope.leadMagnetSlug ?? null,
      funnelSlug: scope.funnelSlug ?? null,
      scarcityStateAtEntry: status,
      wasWaitlisted,
      cycleJoined: cycle.cycleStartDate ? cycle.cycleStartDate.toISOString() : null,
      configId: selected.id,
      routeDecision: route,
    } satisfies LeadScarcityMeta,
  };
}

function toIsoOrNull(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function getDynamicScarcityDisplay(input: DynamicScarcityInput): DynamicScarcityDisplay {
  return {
    ...input,
    message: formatScarcityMessage(input),
  };
}

async function evaluatePpcCampaignCapacityGuard(campaign: PpcCampaignGuardRecord): Promise<{
  campaignId: number;
  blocked: boolean;
  reason?: string;
  scarcity?: ScarcityEvaluationResult | null;
}> {
  const scarcity = await evaluateScarcityForContext({
    offerSlug: campaign.offerSlug ?? undefined,
    leadMagnetSlug: campaign.leadMagnetSlug ?? undefined,
    funnelSlug: campaign.landingPagePath?.replace(/^\//, "").split("/")[0] ?? undefined,
  });
  if (!scarcity) return { campaignId: campaign.id, blocked: false, scarcity: null };
  if (scarcity.status === "full" || scarcity.status === "waitlist") {
    return {
      campaignId: campaign.id,
      blocked: true,
      reason: `Capacity unavailable for offer path (${scarcity.message}). Shift campaign to lead magnet nurture route.`,
      scarcity,
    };
  }
  return { campaignId: campaign.id, blocked: false, scarcity };
}

export async function getPpcCapacityGuard(campaignId: number): Promise<{
  campaignId: number;
  blocked: boolean;
  reason?: string;
  scarcity?: ScarcityEvaluationResult | null;
}> {
  const [campaign] = await db
    .select({
      id: ppcCampaigns.id,
      offerSlug: ppcCampaigns.offerSlug,
      landingPagePath: ppcCampaigns.landingPagePath,
      trackingParamsJson: ppcCampaigns.trackingParamsJson,
    })
    .from(ppcCampaigns)
    .where(eq(ppcCampaigns.id, campaignId))
    .limit(1);
  if (!campaign) return { campaignId, blocked: false };
  return evaluatePpcCampaignCapacityGuard({
    id: campaign.id,
    offerSlug: campaign.offerSlug,
    leadMagnetSlug: inferPpcLeadMagnetSlug(campaign),
    landingPagePath: campaign.landingPagePath,
  });
}

type PpcBlockedCampaignSummary = {
  id: number;
  name: string;
  offerSlug: string | null;
  readinessScore: number;
  reason: string;
};

export async function getScarcityBlockedCampaignSummaries() {
  const campaigns = await db
    .select({
      id: ppcCampaigns.id,
      name: ppcCampaigns.name,
      offerSlug: ppcCampaigns.offerSlug,
      landingPagePath: ppcCampaigns.landingPagePath,
      trackingParamsJson: ppcCampaigns.trackingParamsJson,
      readinessScore: ppcCampaigns.readinessScore,
      status: ppcCampaigns.status,
    })
    .from(ppcCampaigns)
    .orderBy(desc(ppcCampaigns.updatedAt))
    .limit(100);

  const blocked: PpcBlockedCampaignSummary[] = [];
  for (const campaign of campaigns) {
    const normalizedStatus = (campaign.status ?? "").toLowerCase();
    if (normalizedStatus !== "active") continue;
    const guard = await evaluatePpcCampaignCapacityGuard({
      id: campaign.id,
      offerSlug: campaign.offerSlug,
      leadMagnetSlug: inferPpcLeadMagnetSlug(campaign),
      landingPagePath: campaign.landingPagePath,
    });
    if (!guard.blocked) continue;
    blocked.push({
      id: campaign.id,
      name: campaign.name,
      offerSlug: campaign.offerSlug,
      readinessScore: Number(campaign.readinessScore ?? 0),
      reason: guard.reason ?? "Capacity blocked",
    });
  }
  return blocked;
}

export async function getFunnelScarcityReadinessSignals() {
  const configs = (await listScarcityConfigs()).filter((cfg) => cfg.isActive);
  const readiness: Array<{
    configId: number;
    name: string;
    status: ScarcityStatus;
    availableSlots: number;
    usedSlots: number;
    waitlistCount: number;
    nextCycleDate: string | null;
    message: string;
  }> = [];
  for (const config of configs) {
    const scope = mapScopeFromConfig(config);
    const evalResult = await evaluateScarcityForContext({
      personaId: scope.personaId,
      offerSlug: scope.offerSlug,
      leadMagnetSlug: scope.leadMagnetSlug,
      funnelSlug: scope.funnelSlug,
    });
    if (!evalResult) continue;
    readiness.push({
      configId: config.id,
      name: config.name,
      status: evalResult.status,
      availableSlots: evalResult.availableSlots,
      usedSlots: evalResult.usedSlots,
      waitlistCount: evalResult.waitlistCount,
      nextCycleDate: evalResult.nextCycleDate,
      message: evalResult.message,
    });
  }
  return readiness;
}
