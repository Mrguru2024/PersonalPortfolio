/**
 * Revenue Ops funnel metrics (lead → contact → book → pay). Query-only; no side effects.
 */

import { and, count, countDistinct, desc, eq, gte, isNotNull, ne, or, sql } from "drizzle-orm";
import { db } from "@server/db";
import { crmActivityLog, crmContacts } from "@shared/crmSchema";

export type RevenueOpsFunnelMetrics = {
  totalLeads: number;
  leadsWithPhone: number;
  bookedLeads: number;
  contactedLeads: number;
  paymentsLogged: number;
  missedCalls7d: number;
  bookingClicks30d: number;
  topSources: { source: string; count: number }[];
};

export async function getRevenueOpsFunnelMetrics(): Promise<RevenueOpsFunnelMetrics> {
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 86400000);
  const thirtyDaysAgo = new Date(now - 30 * 86400000);

  const [totalLeadsRow] = await db.select({ n: count() }).from(crmContacts).where(eq(crmContacts.type, "lead"));
  const [withPhoneRow] = await db
    .select({ n: count() })
    .from(crmContacts)
    .where(and(eq(crmContacts.type, "lead"), isNotNull(crmContacts.phone), sql`length(trim(${crmContacts.phone})) > 5`));
  const [bookedRow] = await db
    .select({ n: count() })
    .from(crmContacts)
    .where(and(eq(crmContacts.type, "lead"), isNotNull(crmContacts.bookedCallAt)));
  const [contactedRow] = await db
    .select({ n: count() })
    .from(crmContacts)
    .where(
      and(eq(crmContacts.type, "lead"), or(isNotNull(crmContacts.lastContactedAt), ne(crmContacts.status, "new"))),
    );
  const [paymentsRow] = await db
    .select({ n: countDistinct(crmActivityLog.contactId) })
    .from(crmActivityLog)
    .where(
      and(eq(crmActivityLog.type, "revenue_ops_payment_completed"), gte(crmActivityLog.createdAt, thirtyDaysAgo)),
    );
  const [missedRow] = await db
    .select({ n: count() })
    .from(crmActivityLog)
    .where(and(eq(crmActivityLog.type, "revenue_ops_missed_call"), gte(crmActivityLog.createdAt, sevenDaysAgo)));
  const [clicksRow] = await db
    .select({ n: count() })
    .from(crmActivityLog)
    .where(
      and(eq(crmActivityLog.type, "revenue_ops_booking_link_click"), gte(crmActivityLog.createdAt, thirtyDaysAgo)),
    );

  const leadSources = await db
    .select({ utm: crmContacts.utmSource, src: crmContacts.source })
    .from(crmContacts)
    .where(eq(crmContacts.type, "lead"));
  const sourceMap = new Map<string, number>();
  for (const row of leadSources) {
    const label = (row.utm?.trim() || row.src?.trim() || "(none)") as string;
    sourceMap.set(label, (sourceMap.get(label) ?? 0) + 1);
  }
  const topSources = [...sourceMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([source, n]) => ({ source, count: n }));

  return {
    totalLeads: Number(totalLeadsRow?.n ?? 0),
    leadsWithPhone: Number(withPhoneRow?.n ?? 0),
    bookedLeads: Number(bookedRow?.n ?? 0),
    contactedLeads: Number(contactedRow?.n ?? 0),
    paymentsLogged: Number(paymentsRow?.n ?? 0),
    missedCalls7d: Number(missedRow?.n ?? 0),
    bookingClicks30d: Number(clicksRow?.n ?? 0),
    topSources,
  };
}
