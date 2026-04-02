import { and, desc, eq, gte, inArray, isNull, lte, lt, sql } from "drizzle-orm";
import { db } from "@server/db";
import {
  crmActivityLog,
  clientInvoices,
  clientQuotes,
  crmContacts,
  crmTasks,
  guaranteeMetrics,
  ppcTrackedCalls,
  schedulingAppointments,
  users,
  visitorActivity,
  type GuaranteeTypeValue,
} from "@shared/schema";
import type {
  GuaranteeActionType,
  GuaranteeCompliance,
  GuaranteeControlFilter,
  GuaranteeControlRow,
  GuaranteePreviewInput,
  GuaranteePreviewOutput,
  GuaranteeSnapshot,
  GuaranteeStatusValue,
} from "@shared/guaranteeEngine";
import {
  calculateGuaranteePreview as calculateGuaranteePreviewFromLogic,
  evaluateGuaranteeFromMetrics,
} from "./guaranteeEngineLogic";

type Timeframe = { start: Date; end: Date; label: string };

type UserContext = {
  userId: number;
  email: string | null;
  contacts: Array<{
    id: number;
    status: string | null;
    email: string;
    phone: string | null;
    customFields: Record<string, unknown> | null;
    createdAt: Date;
  }>;
};

const LEAD_BOOKING_RELATED_STATUSES = new Set([
  "qualified",
  "proposal",
  "negotiation",
  "won",
]);

const BOOKED_STATUSES = new Set(["confirmed", "completed"]);

const GUARANTEE_TYPES: GuaranteeTypeValue[] = [
  "lead_flow",
  "booked_jobs",
  "conversion",
  "payback",
];

const NON_COMPLIANCE_MIN_TRAFFIC = Math.max(
  10,
  Math.min(500, Number(process.env.GUARANTEE_MIN_TRAFFIC_THRESHOLD ?? 25)),
);

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function minusDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() - days);
  return x;
}

function toDateOnlyIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function pct(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : 0;
}

function clampNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function deriveCompliance(params: {
  usesBookingSystem: boolean;
  leadResponseCompliant: boolean;
  followsRecommendedSetup: boolean;
  minimumTrafficMet: boolean;
}): GuaranteeCompliance {
  const reasons: string[] = [];
  if (!params.usesBookingSystem) reasons.push("Client is not using the booking system.");
  if (!params.leadResponseCompliant) reasons.push("Client has overdue follow-up tasks on active leads.");
  if (!params.followsRecommendedSetup) reasons.push("Client setup recommendations are incomplete.");
  if (!params.minimumTrafficMet) reasons.push("Minimum traffic threshold is not met.");
  return { isCompliant: reasons.length === 0, reasons };
}

async function computeSystemCostCents(clientId: number, timeframe: Timeframe): Promise<number> {
  const [invoicesPaid] = await db
    .select({
      total: sql<number>`coalesce(sum(${clientInvoices.amount}), 0)`,
    })
    .from(clientInvoices)
    .where(
      and(
        eq(clientInvoices.userId, clientId),
        inArray(clientInvoices.status, ["paid", "sent", "overdue"]),
        gte(clientInvoices.createdAt, timeframe.start),
        lte(clientInvoices.createdAt, timeframe.end),
      ),
    );
  return clampNonNegativeInt(Number(invoicesPaid?.total ?? 0));
}

async function computeRevenueCents(clientId: number, timeframe: Timeframe): Promise<number> {
  const [quoteRevenue] = await db
    .select({
      total: sql<number>`coalesce(sum(${clientQuotes.totalAmount}), 0)`,
    })
    .from(clientQuotes)
    .where(
      and(
        eq(clientQuotes.userId, clientId),
        inArray(clientQuotes.status, ["accepted", "in_development", "completed"]),
        gte(clientQuotes.createdAt, timeframe.start),
        lte(clientQuotes.createdAt, timeframe.end),
      ),
    );
  return clampNonNegativeInt(Number(quoteRevenue?.total ?? 0));
}

async function loadUserContext(userId: number): Promise<UserContext> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then((r) => r[0]);
  const email = user?.email?.trim()?.toLowerCase() ?? null;
  const contacts =
    email
      ? await db
          .select({
            id: crmContacts.id,
            status: crmContacts.status,
            email: crmContacts.email,
            phone: crmContacts.phone,
            customFields: crmContacts.customFields,
            createdAt: crmContacts.createdAt,
          })
          .from(crmContacts)
          .where(and(eq(crmContacts.type, "lead"), sql`lower(trim(coalesce(${crmContacts.email}, ''))) = ${email}`))
      : [];
  return { userId, email, contacts };
}

function hasValidContact(row: { email: string; phone: string | null }): boolean {
  const hasEmail = typeof row.email === "string" && row.email.includes("@");
  const phoneDigits = String(row.phone ?? "").replace(/\D/g, "");
  return hasEmail || phoneDigits.length >= 10;
}

function hasServiceIntent(row: { status: string | null; customFields: Record<string, unknown> | null }): boolean {
  const status = String(row.status ?? "").toLowerCase();
  if (LEAD_BOOKING_RELATED_STATUSES.has(status)) return true;
  const custom = row.customFields ?? {};
  if (typeof custom.primaryGoal === "string") return true;
  if (typeof custom.mainChallenge === "string") return true;
  if (typeof custom.serviceInterest === "string") return true;
  const qualification = String(custom.sourceQualificationResult ?? "").toLowerCase();
  return qualification === "qualified" || qualification === "high_intent";
}

async function computeQualifiedLeadsForUser(
  context: UserContext,
  timeframe: Timeframe,
): Promise<number> {
  const contactsInWindow = context.contacts.filter(
    (c) => c.createdAt >= timeframe.start && c.createdAt <= timeframe.end,
  );

  const contactIds = context.contacts.map((c) => c.id);
  const [ppcCallRows, inboundSmsRows] = await Promise.all([
    contactIds.length > 0
      ? db
          .select({
            crmContactId: ppcTrackedCalls.crmContactId,
            disposition: ppcTrackedCalls.disposition,
          })
          .from(ppcTrackedCalls)
          .where(
            and(
              inArray(ppcTrackedCalls.crmContactId, contactIds),
              gte(ppcTrackedCalls.createdAt, timeframe.start),
              lte(ppcTrackedCalls.createdAt, timeframe.end),
            ),
          )
      : Promise.resolve([]),
    contactIds.length > 0
      ? db
          .select({
            contactId: crmActivityLog.contactId,
            type: crmActivityLog.type,
          })
          .from(crmActivityLog)
          .where(
            and(
              inArray(crmActivityLog.contactId, contactIds),
              eq(crmActivityLog.type, "revenue_ops_sms_inbound"),
              gte(crmActivityLog.createdAt, timeframe.start),
              lte(crmActivityLog.createdAt, timeframe.end),
            ),
          )
      : Promise.resolve([]),
  ]);

  const qualifiedByContactId = new Set<number>();

  for (const row of contactsInWindow) {
    if (hasValidContact(row) && hasServiceIntent(row)) {
      qualifiedByContactId.add(row.id);
    }
  }

  for (const row of ppcCallRows) {
    if (row.crmContactId == null) continue;
    const disposition = String(row.disposition ?? "").toLowerCase();
    if (disposition.includes("qualified") || disposition.includes("booked") || disposition.includes("inquiry")) {
      qualifiedByContactId.add(row.crmContactId);
    }
  }

  for (const row of inboundSmsRows) {
    if (row.contactId != null && String(row.type).toLowerCase() === "revenue_ops_sms_inbound") {
      qualifiedByContactId.add(row.contactId);
    }
  }

  return qualifiedByContactId.size;
}

async function computeBookedJobsForUser(context: UserContext, timeframe: Timeframe): Promise<number> {
  if (!context.email) return 0;

  const appointmentRows = await db
    .select({
      id: schedulingAppointments.id,
      status: schedulingAppointments.status,
      guestEmail: schedulingAppointments.guestEmail,
      metadataJson: schedulingAppointments.metadataJson,
      startAt: schedulingAppointments.startAt,
      createdAt: schedulingAppointments.createdAt,
    })
    .from(schedulingAppointments)
    .where(
      and(
        gte(schedulingAppointments.createdAt, timeframe.start),
        lte(schedulingAppointments.createdAt, timeframe.end),
        sql`lower(trim(coalesce(${schedulingAppointments.guestEmail}, ''))) = ${context.email}`,
      ),
    );

  const booked = appointmentRows.filter((row) => {
    const status = String(row.status ?? "").toLowerCase();
    if (BOOKED_STATUSES.has(status)) return true;
    const metadata = (row.metadataJson as Record<string, unknown> | null) ?? {};
    return metadata.manualBooked === true;
  });
  return booked.length;
}

async function computeBaselineConversionRate(
  context: UserContext,
  timeframe: Timeframe,
): Promise<number | null> {
  const previousWindow = {
    start: startOfDay(minusDays(timeframe.start, 30)),
    end: endOfDay(minusDays(timeframe.start, 1)),
    label: "baseline",
  };
  const [qualified, booked] = await Promise.all([
    computeQualifiedLeadsForUser(context, previousWindow),
    computeBookedJobsForUser(context, previousWindow),
  ]);
  if (qualified === 0) return null;
  return pct(booked / qualified);
}

async function computeTrafficCountForUser(context: UserContext, timeframe: Timeframe): Promise<number> {
  const contactIds = context.contacts.map((c) => c.id);
  if (contactIds.length === 0) return 0;
  const [traffic] = await db
    .select({ count: sql<number>`count(*)` })
    .from(visitorActivity)
    .where(
      and(
        inArray(visitorActivity.leadId, contactIds),
        gte(visitorActivity.createdAt, timeframe.start),
        lte(visitorActivity.createdAt, timeframe.end),
      ),
    );
  return clampNonNegativeInt(Number(traffic?.count ?? 0));
}

function followsRecommendedSetup(context: UserContext): boolean {
  const hasNonCompliantFlag = context.contacts.some((c) => {
    const custom = c.customFields ?? {};
    return (
      custom.recommendedSetupComplete === false ||
      custom.clientNonCompliance === true ||
      custom.setupChecklistComplete === false
    );
  });
  return !hasNonCompliantFlag;
}

async function evaluateCompliance(
  context: UserContext,
  timeframe: Timeframe,
  bookingsCount: number,
  trafficCount: number,
): Promise<GuaranteeCompliance> {
  const contactIds = context.contacts.map((c) => c.id);
  const [appointmentsCountRow, overdueTaskCountRow] = await Promise.all([
    context.email
      ? db
          .select({ count: sql<number>`count(*)` })
          .from(schedulingAppointments)
          .where(
            and(
              gte(schedulingAppointments.createdAt, timeframe.start),
              lte(schedulingAppointments.createdAt, timeframe.end),
              sql`lower(trim(coalesce(${schedulingAppointments.guestEmail}, ''))) = ${context.email}`,
            ),
          )
          .then((r) => r[0])
      : Promise.resolve({ count: 0 }),
    contactIds.length > 0
      ? db
          .select({ count: sql<number>`count(*)` })
          .from(crmTasks)
          .where(
            and(
              inArray(crmTasks.contactId, contactIds),
              isNull(crmTasks.completedAt),
              inArray(crmTasks.status, ["pending", "in_progress"]),
              lt(crmTasks.dueAt, new Date()),
            ),
          )
          .then((r) => r[0])
      : Promise.resolve({ count: 0 }),
  ]);

  const usesBookingSystem = bookingsCount > 0 || Number(appointmentsCountRow?.count ?? 0) > 0;
  const leadResponseCompliant = Number(overdueTaskCountRow?.count ?? 0) === 0;
  const recommendedSetupComplete = followsRecommendedSetup(context);
  const minimumTrafficMet = trafficCount >= NON_COMPLIANCE_MIN_TRAFFIC;

  return deriveCompliance({
    usesBookingSystem,
    leadResponseCompliant,
    followsRecommendedSetup: recommendedSetupComplete,
    minimumTrafficMet,
  });
}

function suggestedActionsFromSnapshot(snapshot: GuaranteeSnapshot): GuaranteeActionType[] {
  const actions: GuaranteeActionType[] = [];
  const byType = new Map(snapshot.rows.map((row) => [row.type, row.status]));

  if (snapshot.compliance.reasons.length > 0 || byType.get("lead_flow") === "not_met") {
    actions.push("increase_traffic");
  }
  if (byType.get("booked_jobs") === "not_met") {
    actions.push("fix_conversion_flow");
  }
  if (byType.get("conversion") === "not_met") {
    actions.push("optimize_funnel");
  }
  if (byType.get("payback") === "not_met") {
    actions.push("adjust_offer");
  }
  return actions.length > 0 ? actions : ["optimize_funnel"];
}

async function persistGuaranteeRows(snapshot: GuaranteeSnapshot): Promise<void> {
  for (const row of snapshot.rows) {
    await db
      .insert(guaranteeMetrics)
      .values({
        clientId: snapshot.clientId,
        timeframeStart: snapshot.timeframeStart,
        timeframeEnd: snapshot.timeframeEnd,
        qualifiedLeadsCount: row.qualifiedLeadsCount,
        bookedJobsCount: row.bookedJobsCount,
        conversionRate: row.conversionRate,
        revenueGenerated: row.revenueGenerated,
        systemCost: row.systemCost,
        roiPercentage: row.roiPercentage,
        guaranteeStatus: row.status,
        guaranteeType: row.type,
      })
      .onConflictDoUpdate({
        target: [
          guaranteeMetrics.clientId,
          guaranteeMetrics.timeframeStart,
          guaranteeMetrics.timeframeEnd,
          guaranteeMetrics.guaranteeType,
        ],
        set: {
          qualifiedLeadsCount: row.qualifiedLeadsCount,
          bookedJobsCount: row.bookedJobsCount,
          conversionRate: row.conversionRate,
          revenueGenerated: row.revenueGenerated,
          systemCost: row.systemCost,
          roiPercentage: row.roiPercentage,
          guaranteeStatus: row.status,
          updatedAt: new Date(),
        },
      });
  }
}

function normalizeTimeframe(days: number): Timeframe {
  const safeDays = Math.min(180, Math.max(7, Math.round(days)));
  const end = endOfDay(new Date());
  const start = startOfDay(minusDays(end, safeDays - 1));
  return { start, end, label: `${safeDays}-day rolling window` };
}

export async function buildGuaranteeSnapshotForClient(
  clientId: number,
  timeframeDays = 30,
): Promise<GuaranteeSnapshot> {
  const timeframe = normalizeTimeframe(timeframeDays);
  const context = await loadUserContext(clientId);
  const [qualifiedLeadsCount, bookedJobsCount, baselineConversionRate, revenueGenerated, systemCost, trafficCount] =
    await Promise.all([
      computeQualifiedLeadsForUser(context, timeframe),
      computeBookedJobsForUser(context, timeframe),
      computeBaselineConversionRate(context, timeframe),
      computeRevenueCents(clientId, timeframe),
      computeSystemCostCents(clientId, timeframe),
      computeTrafficCountForUser(context, timeframe),
    ]);
  const compliance = await evaluateCompliance(
    context,
    timeframe,
    bookedJobsCount,
    trafficCount,
  );

  const conversionRate = qualifiedLeadsCount === 0 ? 0 : pct(bookedJobsCount / qualifiedLeadsCount);
  const roiPercentage = systemCost <= 0 ? 0 : pct(((revenueGenerated - systemCost) / systemCost) * 100);
  const evaluation = evaluateGuaranteeFromMetrics({
    qualifiedLeadsCount,
    bookedJobsCount,
    conversionRate,
    baselineConversionRate,
    revenueGenerated,
    systemCost,
    roiPercentage,
    compliance,
  });

  const rows = evaluation.rows.map((row) => {
    if (!GUARANTEE_TYPES.includes(row.type)) return { ...row, type: "lead_flow" as GuaranteeTypeValue };
    return row;
  });

  const dashboardStatus = evaluation.dashboardStatus;
  const dashboardColor = evaluation.dashboardColor;

  const snapshot: GuaranteeSnapshot = {
    clientId,
    timeframeStart: toDateOnlyIso(timeframe.start),
    timeframeEnd: toDateOnlyIso(timeframe.end),
    timeframeLabel: timeframe.label,
    qualifiedLeadsCount,
    bookedJobsCount,
    conversionRate,
    baselineConversionRate,
    revenueGenerated,
    systemCost,
    roiPercentage,
    compliance,
    rows,
    dashboardStatus,
    dashboardColor,
  };

  await persistGuaranteeRows(snapshot);
  return snapshot;
}

async function listEligibleClientUsers(): Promise<Array<{ id: number; label: string | null; email: string | null }>> {
  const rows = await db
    .select({ id: users.id, label: users.full_name, email: users.email })
    .from(users)
    .where(and(eq(users.isAdmin, false), isNull(users.resetToken)))
    .orderBy(desc(users.id))
    .limit(180);

  return rows.filter((u) => !!u.email || !!u.label);
}

export async function listGuaranteeControlRows(
  filter: GuaranteeControlFilter,
): Promise<GuaranteeControlRow[]> {
  const eligibleUsers = await listEligibleClientUsers();

  const snapshots = await Promise.all(
    eligibleUsers.map(async (u) => {
      const snapshot = await buildGuaranteeSnapshotForClient(u.id, 30);
      const clientLabel = u.label?.trim() || u.email?.trim() || `Client #${u.id}`;
      const row: GuaranteeControlRow = {
        clientId: u.id,
        clientLabel,
        qualifiedLeadsCount: snapshot.qualifiedLeadsCount,
        bookedJobsCount: snapshot.bookedJobsCount,
        conversionRate: snapshot.conversionRate,
        roiPercentage: snapshot.roiPercentage,
        dashboardStatus: snapshot.dashboardStatus,
        dashboardColor: snapshot.dashboardColor,
        compliance: snapshot.compliance,
        suggestedActions: suggestedActionsFromSnapshot(snapshot),
      };
      return row;
    }),
  );

  if (filter === "all") return snapshots;
  if (filter === "performing") return snapshots.filter((s) => s.dashboardStatus === "met");
  if (filter === "not_met") return snapshots.filter((s) => s.dashboardStatus === "action_required");
  return snapshots.filter((s) => s.dashboardStatus === "in_progress");
}

export function calculateGuaranteePreview(
  input: GuaranteePreviewInput,
): GuaranteePreviewOutput {
  return calculateGuaranteePreviewFromLogic(input);
}

