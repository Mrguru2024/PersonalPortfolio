/**
 * Latest AMIE row linked to any of the client’s CRM contacts (e.g. Market Score).
 * Returns copy safe for the client Growth System — no raw scores in the UI payload beyond prose hints.
 */
import { db } from "@server/db";
import {
  amieMarketResearch,
  amieOpportunityReport,
  amieMarketData,
} from "@shared/schema";
import type { AmieClientDigest, BandSummary } from "@shared/clientGrowthSnapshot";
import { desc, eq, inArray } from "drizzle-orm";

export type AmieClientGrowthSlice = {
  digest: AmieClientDigest | null;
  /** When present, prefer for Diagnose “Market” band instead of score-only heuristics. */
  marketBand: BandSummary | null;
};

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function tierToHeadline(tier: string): string {
  const t = tier.toLowerCase();
  if (t === "high") return "Your latest market scan suggests strong headroom if you execute with focus.";
  if (t === "low")
    return "Your latest market scan suggests a tougher lane—differentiation and speed-to-lead matter most.";
  return "Your latest market scan shows a balanced market—wins go to clear offers and dependable follow-up.";
}

function marketBandFromTier(tier: string | null | undefined): BandSummary {
  const t = (tier ?? "medium").toLowerCase();
  if (t === "high") {
    return {
      label: "Strong opportunity",
      summary:
        "Your saved market intelligence rated this lane as high potential—discipline on follow-up and a clear offer matter most now.",
    };
  }
  if (t === "low") {
    return {
      label: "Tighter lane",
      summary:
        "Your saved market intelligence flagged more headwinds—win with proof, speed, and a standout promise clients can repeat.",
    };
  }
  return {
    label: "Balanced",
    summary:
      "Your saved market intelligence shows a mix of demand and competition—consistency in messaging and booking path moves the needle.",
  };
}

function demandVsCompetitionSentence(
  data: typeof amieMarketData.$inferSelect | undefined,
): string | undefined {
  if (!data) return undefined;
  const demand = data.demandScore;
  const comp = data.competitionScore;
  const trend = (data.marketTrend ?? "stable").toLowerCase();
  const trendPhrase =
    trend === "growing" ? "demand looks firmer in this slice"
    : trend === "declining" ? "demand looks softer in this slice"
    : "demand looks steady in this slice";

  if (demand >= 65 && comp <= 55) {
    return `Compared to your last scan, ${trendPhrase}, with relatively more breathing room on competition—good for a sharp niche message.`;
  }
  if (comp >= 65 && demand >= 45) {
    return `Compared to your last scan, competition runs hot—proof, reviews, and fast replies carry more weight than generic reach.`;
  }
  return `Compared to your last scan, ${trendPhrase}; tighten the headline and booking path to convert the attention you earn.`;
}

export async function loadAmieDigestForCrmContacts(contactIds: number[]): Promise<AmieClientGrowthSlice> {
  const ids = [...new Set(contactIds.filter((id) => Number.isFinite(id) && id > 0))];
  if (ids.length === 0) return { digest: null, marketBand: null };

  const researchRows = await db
    .select()
    .from(amieMarketResearch)
    .where(inArray(amieMarketResearch.crmContactId, ids))
    .orderBy(desc(amieMarketResearch.createdAt))
    .limit(1);

  const research = researchRows[0];
  if (!research?.id) return { digest: null, marketBand: null };

  const [report] = await db
    .select()
    .from(amieOpportunityReport)
    .where(eq(amieOpportunityReport.researchId, research.id))
    .limit(1);

  const [marketData] = await db
    .select()
    .from(amieMarketData)
    .where(eq(amieMarketData.researchId, research.id))
    .limit(1);

  if (!report) return { digest: null, marketBand: null };

  const insightBullets = (report.insights ?? [])
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .slice(0, 4)
    .map((x) => clip(x, 180));

  const summaryLine = clip(report.summary || report.recommendations || tierToHeadline(report.opportunityTier), 280);

  const digest: AmieClientDigest = {
    summaryLine,
    opportunityHeadline: tierToHeadline(report.opportunityTier ?? "medium"),
    insightBullets: insightBullets.length > 0 ? insightBullets : [clip(report.personaStrategy || summaryLine, 180)],
    demandVsCompetitionHint: demandVsCompetitionSentence(marketData),
  };

  return {
    digest,
    marketBand: marketBandFromTier(report.opportunityTier),
  };
}
