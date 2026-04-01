import { db } from "@server/db";
import {
  amieMarketResearch,
  amieMarketData,
  amieOpportunityReport,
  type AmieMarketResearchRow,
  type AmieMarketDataRow,
  type AmieOpportunityReportRow,
} from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import type { AmieFullAnalysis, AmieMarketInput } from "./types";
import { fetchLiveAugmentedSignals } from "./adapters/liveSignals";
import { buildAmieFullAnalysis } from "./strategyOutput";
import { getCachedAmie, setCachedAmie, amieCacheKey } from "./cache";
export async function runAmieAnalysis(
  input: AmieMarketInput,
  opts?: { skipCache?: boolean },
): Promise<AmieFullAnalysis> {
  const key = amieCacheKey(input);
  if (!opts?.skipCache) {
    const hit = getCachedAmie(key);
    if (hit) return hit;
  }

  const { signals, mode, sources } = await fetchLiveAugmentedSignals(input);
  const full = buildAmieFullAnalysis(input, signals, sources, mode);
  setCachedAmie(key, full);
  return full;
}

export function pickAmieDimension(
  full: AmieFullAnalysis,
  dimension:
    | "demand"
    | "competition"
    | "purchase-power"
    | "pain"
    | "targeting-difficulty"
    | "trend"
    | "pricing"
    | "opportunity",
): Record<string, unknown> {
  const md = full.marketData;
  switch (dimension) {
    case "demand":
      return { demandScore: md.demandScore, keywordData: md.keywordData, dataMode: md.dataMode };
    case "competition":
      return { competitionScore: md.competitionScore, competitionData: md.competitionData };
    case "purchase-power":
      return { purchasePowerScore: md.purchasePowerScore, incomeData: md.incomeData };
    case "pain":
      return { painScore: md.painScore, note: "Derived from urgency vs informational proxies in mock/live signals." };
    case "targeting-difficulty":
      return { targetingDifficulty: md.targetingDifficulty };
    case "trend":
      return { marketTrend: md.marketTrend, trendData: md.trendData };
    case "pricing":
      return { avgPrice: md.avgPrice, competitionData: md.competitionData };
    case "opportunity":
      return {
        opportunityTier: full.opportunity.opportunityTier,
        rulesFired: full.opportunity.rulesFired,
        summary: full.opportunity.summary,
        insights: full.opportunity.insights,
        recommendations: full.opportunity.recommendations,
        integrationHints: full.integrationHints,
      };
    default:
      return {};
  }
}

export async function saveAmieAnalysis(params: {
  createdByUserId: number | null;
  input: AmieMarketInput;
  analysis: AmieFullAnalysis;
  crmContactId?: number | null;
  funnelSource?: string | null;
}): Promise<number> {
  const { createdByUserId, input, analysis, crmContactId, funnelSource } = params;

  return db.transaction(async (tx) => {
    const [research] = await tx
      .insert(amieMarketResearch)
      .values({
        projectKey: input.projectKey ?? "ascendra_main",
        industry: input.industry.trim(),
        serviceType: input.serviceType.trim(),
        location: input.location.trim(),
        persona: input.persona.trim(),
        createdByUserId: createdByUserId ?? undefined,
        crmContactId: crmContactId ?? undefined,
        funnelSource: funnelSource?.trim() || undefined,
      })
      .returning();
    if (!research) throw new Error("AMIE: insert research failed");

    const md = analysis.marketData;
    await tx.insert(amieMarketData).values({
      researchId: research.id,
      demandScore: md.demandScore,
      competitionScore: md.competitionScore,
      purchasePowerScore: md.purchasePowerScore,
      painScore: md.painScore,
      targetingDifficulty: md.targetingDifficulty,
      marketTrend: md.marketTrend,
      avgPrice: md.avgPrice ?? undefined,
      keywordData: md.keywordData,
      trendData: md.trendData,
      incomeData: md.incomeData,
      competitionData: md.competitionData,
      sources: md.sources,
      dataMode: md.dataMode,
    });

    const op = analysis.opportunity;
    await tx.insert(amieOpportunityReport).values({
      researchId: research.id,
      summary: op.summary,
      insights: op.insights,
      recommendations: op.recommendations,
      personaStrategy: op.personaStrategy,
      leadStrategy: op.leadStrategy,
      funnelStrategy: op.funnelStrategy,
      adStrategy: op.adStrategy,
      opportunityTier: op.opportunityTier,
      rulesFired: op.rulesFired,
      integrationHintsJson: {
        ...analysis.integrationHints,
        crmMetadata: { engine: "amie" as const, researchId: research.id },
      },
    });

    return research.id;
  });
}

export type SavedAmieListItem = Pick<
  AmieMarketResearchRow,
  "id" | "industry" | "serviceType" | "location" | "persona" | "createdAt" | "crmContactId" | "funnelSource"
>;

export async function listAmieReports(limit = 30): Promise<SavedAmieListItem[]> {
  const rows = await db
    .select({
      id: amieMarketResearch.id,
      industry: amieMarketResearch.industry,
      serviceType: amieMarketResearch.serviceType,
      location: amieMarketResearch.location,
      persona: amieMarketResearch.persona,
      createdAt: amieMarketResearch.createdAt,
      crmContactId: amieMarketResearch.crmContactId,
      funnelSource: amieMarketResearch.funnelSource,
    })
    .from(amieMarketResearch)
    .orderBy(desc(amieMarketResearch.createdAt))
    .limit(Math.min(100, Math.max(1, limit)));

  return rows;
}

export async function getAmieReportById(id: number): Promise<{
  research: AmieMarketResearchRow;
  marketData: AmieMarketDataRow;
  report: AmieOpportunityReportRow;
} | null> {
  const [research] = await db.select().from(amieMarketResearch).where(eq(amieMarketResearch.id, id)).limit(1);
  if (!research) return null;
  const [data] = await db.select().from(amieMarketData).where(eq(amieMarketData.researchId, id)).limit(1);
  const [report] = await db.select().from(amieOpportunityReport).where(eq(amieOpportunityReport.researchId, id)).limit(1);
  if (!data || !report) return null;
  return { research, marketData: data, report };
}
