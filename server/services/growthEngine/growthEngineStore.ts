import { db } from "@server/db";
import {
  growthAutomationRules,
  growthAutomationRuns,
  growthCallEvents,
  growthCampaignCosts,
  growthFunnelBlueprints,
  growthKnowledgeEntries,
  growthLeadSignals,
  growthRevenueEvents,
} from "@shared/schema";
import { and, count, desc, eq, gte, isNotNull, sql } from "drizzle-orm";

export async function listGrowthRevenueEvents(limit = 80) {
  return db.select().from(growthRevenueEvents).orderBy(desc(growthRevenueEvents.recordedAt)).limit(limit);
}

export async function insertGrowthRevenueEvent(row: typeof growthRevenueEvents.$inferInsert) {
  const [ins] = await db.insert(growthRevenueEvents).values(row).returning();
  return ins;
}

export async function findGrowthRevenueEventByStripeInvoiceId(stripeInvoiceId: string) {
  const id = stripeInvoiceId.trim();
  if (!id) return undefined;
  const [row] = await db
    .select()
    .from(growthRevenueEvents)
    .where(and(eq(growthRevenueEvents.stripeInvoiceId, id), isNotNull(growthRevenueEvents.stripeInvoiceId)))
    .limit(1);
  return row;
}

export async function listGrowthLeadSignals(limit = 100) {
  return db.select().from(growthLeadSignals).orderBy(desc(growthLeadSignals.createdAt)).limit(limit);
}

export async function markGrowthLeadSignalRead(id: number) {
  const [r] = await db
    .update(growthLeadSignals)
    .set({ readAt: new Date() })
    .where(eq(growthLeadSignals.id, id))
    .returning();
  return r;
}

export async function dismissGrowthLeadSignal(id: number) {
  const [r] = await db
    .update(growthLeadSignals)
    .set({ dismissedAt: new Date() })
    .where(eq(growthLeadSignals.id, id))
    .returning();
  return r;
}

export async function listAutomationRules() {
  return db.select().from(growthAutomationRules).orderBy(desc(growthAutomationRules.updatedAt));
}

export async function insertAutomationRule(row: typeof growthAutomationRules.$inferInsert) {
  const [r] = await db.insert(growthAutomationRules).values(row).returning();
  return r;
}

export async function listGrowthCampaignCosts(limit = 60) {
  return db.select().from(growthCampaignCosts).orderBy(desc(growthCampaignCosts.periodStart)).limit(limit);
}

export async function insertGrowthCampaignCost(row: typeof growthCampaignCosts.$inferInsert) {
  const [r] = await db.insert(growthCampaignCosts).values(row).returning();
  return r;
}

export async function listGrowthCallEvents(limit = 80) {
  return db.select().from(growthCallEvents).orderBy(desc(growthCallEvents.recordedAt)).limit(limit);
}

export async function insertGrowthCallEvent(row: typeof growthCallEvents.$inferInsert) {
  const [r] = await db.insert(growthCallEvents).values(row).returning();
  return r;
}

export async function listKnowledgeEntries(limit = 120) {
  return db.select().from(growthKnowledgeEntries).orderBy(desc(growthKnowledgeEntries.updatedAt)).limit(limit);
}

export async function insertKnowledgeEntry(row: typeof growthKnowledgeEntries.$inferInsert) {
  const [r] = await db.insert(growthKnowledgeEntries).values(row).returning();
  return r;
}

const DEFAULT_BLUEPRINT_KEY = "startup";

function defaultFunnelNodes(): unknown[] {
  return [
    { id: "landing", type: "page", label: "Landing", path: "/brand-growth" },
    { id: "cta", type: "cta", label: "Primary CTA" },
    { id: "form", type: "form", label: "Lead capture" },
    { id: "book", type: "booking", label: "Strategy call", path: "/strategy-call" },
    { id: "convert", type: "offer", label: "Conversion / offer" },
  ];
}

function defaultEdges(): unknown[] {
  return [
    { id: "e1", source: "landing", target: "cta" },
    { id: "e2", source: "cta", target: "form" },
    { id: "e3", source: "form", target: "book" },
    { id: "e4", source: "book", target: "convert" },
  ];
}

export async function getOrCreateFunnelBlueprint(key = DEFAULT_BLUEPRINT_KEY) {
  const [row] = await db
    .select()
    .from(growthFunnelBlueprints)
    .where(eq(growthFunnelBlueprints.key, key))
    .limit(1);
  if (row) return row;
  const [ins] = await db
    .insert(growthFunnelBlueprints)
    .values({
      key,
      label: "Startup funnel (template)",
      nodesJson: defaultFunnelNodes(),
      edgesJson: defaultEdges(),
    })
    .returning();
  return ins!;
}

export async function saveFunnelBlueprint(key: string, nodesJson: unknown[], edgesJson: unknown[]) {
  await getOrCreateFunnelBlueprint(key);
  const [r] = await db
    .update(growthFunnelBlueprints)
    .set({ nodesJson, edgesJson, updatedAt: new Date() })
    .where(eq(growthFunnelBlueprints.key, key))
    .returning();
  return r;
}

export async function growthEngineOverview() {
  const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [[sig], [rev], [rules], [knowledge], [runsPending]] = await Promise.all([
    db.select({ c: count() }).from(growthLeadSignals).where(gte(growthLeadSignals.createdAt, since24)),
    db
      .select({ s: sql<number>`coalesce(sum(${growthRevenueEvents.amountCents}),0)`.mapWith(Number) })
      .from(growthRevenueEvents)
      .where(gte(growthRevenueEvents.recordedAt, since30)),
    db.select({ c: count() }).from(growthAutomationRules).where(eq(growthAutomationRules.enabled, true)),
    db.select({ c: count() }).from(growthKnowledgeEntries),
    db.select({ c: count() }).from(growthAutomationRuns).where(eq(growthAutomationRuns.status, "pending")),
  ]);
  return {
    signals24h: Number(sig?.c ?? 0),
    revenue30dCents: rev?.s ?? 0,
    activeRules: Number(rules?.c ?? 0),
    knowledgeEntries: Number(knowledge?.c ?? 0),
    automationRunsPending: Number(runsPending?.c ?? 0),
  };
}
