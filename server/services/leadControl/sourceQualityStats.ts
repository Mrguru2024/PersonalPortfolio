/**
 * Aggregate CRM leads by acquisition channel for source-quality reporting.
 */
import { db } from "@server/db";
import { crmContacts } from "@shared/crmSchema";
import { eq, sql } from "drizzle-orm";

export type LeadSourceQualityRow = {
  channel: string;
  total: number;
  seriousCount: number;
  avgLeadScore: number | null;
  bookedCount: number;
  /** seriousCount / total — 0 when total is 0 */
  seriousRate: number;
};

export async function getLeadSourceQualityStats(limit = 30): Promise<LeadSourceQualityRow[]> {
  const rows = await db
    .select({
      channel: sql<string>`COALESCE(NULLIF(TRIM(${crmContacts.utmSource}), ''), NULLIF(TRIM(${crmContacts.source}), ''), '(unknown)')`,
      total: sql<number>`count(*)::int`,
      seriousCount:
        sql<number>`count(*) filter (where ${crmContacts.intentLevel} in ('hot_lead', 'high_intent'))::int`,
      avgLeadScore: sql<number | null>`round(avg(${crmContacts.leadScore})::numeric, 1)`,
      bookedCount: sql<number>`count(*) filter (where ${crmContacts.bookedCallAt} is not null)::int`,
    })
    .from(crmContacts)
    .where(eq(crmContacts.type, "lead"))
    .groupBy(
      sql`COALESCE(NULLIF(TRIM(${crmContacts.utmSource}), ''), NULLIF(TRIM(${crmContacts.source}), ''), '(unknown)')`,
    )
    .orderBy(sql`count(*) desc`)
    .limit(Math.min(Math.max(limit, 1), 60));

  return rows.map((r) => {
    const total = Number(r.total) || 0;
    const serious = Number(r.seriousCount) || 0;
    return {
      channel: r.channel,
      total,
      seriousCount: serious,
      avgLeadScore: r.avgLeadScore != null ? Number(r.avgLeadScore) : null,
      bookedCount: Number(r.bookedCount) || 0,
      seriousRate: total > 0 ? serious / total : 0,
    };
  });
}
