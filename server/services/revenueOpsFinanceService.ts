/**
 * Revenue Ops — money snapshot: internal operating model, invoices, Stripe-timeline totals, manual ledger.
 * Numbers are only as accurate as source data (manual costs, bank imports, Stripe webhook metadata).
 */

import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@server/db";
import { clientInvoices, clientQuotes, users, type ClientInvoice } from "@shared/schema";
import { crmActivityLog } from "@shared/crmSchema";
import type {
  RevenueOpsFinanceSettings,
  RevenueOpsLedgerEntry,
  RevenueOpsOperatingCostLine,
  RevenueOpsSettingsConfig,
} from "@shared/crmSchema";
import { REVENUE_OPS_DEFAULT_OPERATING_COST_LINES } from "@shared/revenueOpsDefaults";

export const DEFAULT_REPORTING_PERIOD_DAYS = 30;

export const DEFAULT_OPERATING_COST_LINES = REVENUE_OPS_DEFAULT_OPERATING_COST_LINES;

export type RevenueOpsFinanceSnapshot = {
  periodDays: number;
  periodStartIso: string;
  operatingCostLines: RevenueOpsOperatingCostLine[];
  monthlyOperatingCostTotalCents: number;
  /** Prorated internal cost attributed to the reporting window */
  periodInternalCostCents: number;
  revenue: {
    paidInvoicesInPeriodCents: number;
    /** Sum of CRM Stripe payment events in window (may overlap invoices — see notes) */
    stripeTimelinePaymentsCents: number;
    manualLedgerRevenueCents: number;
    /** Invoices + manual revenue (primary “recognized” proxy for the window) */
    primaryRevenueCents: number;
  };
  costs: {
    manualLedgerCostCents: number;
    periodInternalCostCents: number;
    totalCostCents: number;
  };
  /** primaryRevenue - totalCost (simple cash-style snapshot, not GAAP) */
  impliedNetCents: number;
  clientProjectRollups: {
    userId: number | null;
    clientLabel: string;
    paidInPeriodCents: number;
    outstandingCents: number;
    invoiceCount: number;
    quoteCount: number;
  }[];
  notes: string[];
};

function periodStart(periodDays: number): Date {
  const d = new Date();
  d.setTime(d.getTime() - periodDays * 86400000);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function mergeOperatingCostLines(
  configured?: RevenueOpsOperatingCostLine[],
): RevenueOpsOperatingCostLine[] {
  if (configured && configured.length > 0) return configured;
  return DEFAULT_OPERATING_COST_LINES.map((l) => ({ ...l }));
}

export function sumMonthlyOperatingCents(lines: RevenueOpsOperatingCostLine[]): number {
  return lines.reduce((acc, l) => acc + (Number(l.monthlyCents) || 0), 0);
}

function ledgerInRange(entries: RevenueOpsLedgerEntry[] | undefined, start: Date): RevenueOpsLedgerEntry[] {
  if (!entries?.length) return [];
  const t0 = start.getTime();
  return entries.filter((e) => {
    const t = Date.parse(e.occurredAt);
    return Number.isFinite(t) && t >= t0;
  });
}

/** Pull amount from activity metadata or legacy `content` text. */
function amountFromPaymentActivity(metadata: unknown, content: string | null): number {
  const m = metadata as Record<string, unknown> | null;
  if (m && typeof m.amountPaidCents === "number" && Number.isFinite(m.amountPaidCents)) {
    return Math.max(0, Math.round(m.amountPaidCents));
  }
  if (content) {
    const match = content.match(/(\d[\d,]*)\s*$/);
    if (match) {
      const n = parseInt(match[1]!.replace(/\D/g, ""), 10);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

export async function computeRevenueOpsFinanceSnapshot(
  config: RevenueOpsSettingsConfig,
): Promise<RevenueOpsFinanceSnapshot> {
  const finance: RevenueOpsFinanceSettings = config.finance ?? {};
  const periodDays = Math.min(
    366,
    Math.max(7, finance.reportingPeriodDays ?? DEFAULT_REPORTING_PERIOD_DAYS),
  );
  const start = periodStart(periodDays);
  const lines = mergeOperatingCostLines(finance.operatingCostLines);
  const monthlyOperatingCostTotalCents = sumMonthlyOperatingCents(lines);
  const periodInternalCostCents = Math.round((monthlyOperatingCostTotalCents * periodDays) / 30);

  const ledgerFiltered = ledgerInRange(finance.ledgerEntries, start);
  const manualLedgerRevenueCents = ledgerFiltered
    .filter((e) => e.kind === "revenue")
    .reduce((a, e) => a + (Number(e.amountCents) || 0), 0);
  const manualLedgerCostCents = ledgerFiltered
    .filter((e) => e.kind === "cost")
    .reduce((a, e) => a + (Number(e.amountCents) || 0), 0);

  const invoices = await db.select().from(clientInvoices).orderBy(desc(clientInvoices.createdAt));

  let paidInvoicesInPeriodCents = 0;
  for (const inv of invoices) {
    if (inv.status !== "paid" || !inv.paidAt) continue;
    if (inv.paidAt < start) continue;
    paidInvoicesInPeriodCents += Number(inv.amount) || 0;
  }

  const paymentRows = await db
    .select({
      metadata: crmActivityLog.metadata,
      content: crmActivityLog.content,
    })
    .from(crmActivityLog)
    .where(
      and(eq(crmActivityLog.type, "revenue_ops_payment_completed"), gte(crmActivityLog.createdAt, start)),
    );

  let stripeTimelinePaymentsCents = 0;
  for (const row of paymentRows) {
    stripeTimelinePaymentsCents += amountFromPaymentActivity(row.metadata, row.content);
  }

  const primaryRevenueCents = paidInvoicesInPeriodCents + manualLedgerRevenueCents;

  const totalCostCents = periodInternalCostCents + manualLedgerCostCents;
  const impliedNetCents = primaryRevenueCents - totalCostCents;

  const notes: string[] = [
    "Reported revenue combines paid client invoices in the window plus manual ledger revenue. Stripe timeline is shown separately and may duplicate invoice totals once webhooks include amounts.",
    "Internal costs prorate your monthly operating model across the reporting window — not a cash ledger by itself.",
    "Bank sync: record movements in Finance settings ledger (manual or CSV import) until a direct feed exists.",
  ];

  const clientProjectRollups = await buildClientProjectRollups(invoices, start);

  return {
    periodDays,
    periodStartIso: start.toISOString(),
    operatingCostLines: lines,
    monthlyOperatingCostTotalCents,
    periodInternalCostCents,
    revenue: {
      paidInvoicesInPeriodCents,
      stripeTimelinePaymentsCents,
      manualLedgerRevenueCents,
      primaryRevenueCents,
    },
    costs: {
      manualLedgerCostCents,
      periodInternalCostCents,
      totalCostCents,
    },
    impliedNetCents,
    clientProjectRollups,
    notes,
  };
}

async function buildClientProjectRollups(
  invoices: ClientInvoice[],
  periodStartBound: Date,
): Promise<RevenueOpsFinanceSnapshot["clientProjectRollups"]> {
  const byUser = new Map<
    number | null,
    { paidInPeriod: number; outstanding: number; invCount: number; quoteIds: Set<number> }
  >();

  for (const inv of invoices) {
    const uid = inv.userId ?? null;
    if (!byUser.has(uid)) {
      byUser.set(uid, { paidInPeriod: 0, outstanding: 0, invCount: 0, quoteIds: new Set() });
    }
    const agg = byUser.get(uid)!;
    agg.invCount += 1;
    if (inv.quoteId) agg.quoteIds.add(inv.quoteId);

    const amt = Number(inv.amount) || 0;
    if (inv.status === "paid" && inv.paidAt && inv.paidAt >= periodStartBound) {
      agg.paidInPeriod += amt;
    }
    if (inv.status === "sent" || inv.status === "draft" || inv.status === "overdue") {
      agg.outstanding += amt;
    }
  }

  const userIds = [...byUser.keys()].filter((k): k is number => typeof k === "number");
  const userLabels = new Map<number, string>();
  if (userIds.length > 0) {
    const urows = await db
      .select({ id: users.id, username: users.username, email: users.email, full_name: users.full_name })
      .from(users)
      .where(inArray(users.id, userIds));
    for (const u of urows) {
      userLabels.set(u.id, u.full_name?.trim() || u.username || u.email || `User ${u.id}`);
    }
  }

  const quoteIdSet = new Set<number>();
  for (const [, v] of byUser) {
    for (const q of v.quoteIds) quoteIdSet.add(q);
  }
  const quoteTitles = new Map<number, string>();
  if (quoteIdSet.size > 0) {
    const qrows = await db
      .select({ id: clientQuotes.id, title: clientQuotes.title, assessmentId: clientQuotes.assessmentId })
      .from(clientQuotes)
      .where(inArray(clientQuotes.id, [...quoteIdSet]));
    for (const q of qrows) {
      quoteTitles.set(q.id, q.title);
    }
  }

  const rollups: RevenueOpsFinanceSnapshot["clientProjectRollups"] = [];
  for (const [userId, v] of byUser) {
    const clientLabel =
      userId != null
        ? userLabels.get(userId) ?? `Client user #${userId}`
        : "Invoices without portal user";
    const quoteCount = v.quoteIds.size;
    const hint =
      quoteCount > 0
        ? [...v.quoteIds]
            .map((id) => quoteTitles.get(id))
            .filter(Boolean)
            .slice(0, 2)
            .join("; ")
        : "";
    rollups.push({
      userId,
      clientLabel: hint ? `${clientLabel} — ${hint}` : clientLabel,
      paidInPeriodCents: v.paidInPeriod,
      outstandingCents: v.outstanding,
      invoiceCount: v.invCount,
      quoteCount,
    });
  }

  rollups.sort((a, b) => b.paidInPeriodCents + b.outstandingCents - (a.paidInPeriodCents + a.outstandingCents));

  return rollups;
}
