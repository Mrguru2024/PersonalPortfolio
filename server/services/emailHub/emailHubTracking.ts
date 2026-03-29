import { db } from "@server/db";
import { emailHubEvents, emailHubMessages, emailHubUserPrefs } from "@shared/emailHubSchema";
import { crmContacts } from "@shared/crmSchema";
import type {
  EmailHubPriorityFollowUp,
  EmailHubTrackingInsights,
  EmailHubTrackingPagePayload,
} from "@shared/emailHubTrackingPayload";
import { and, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { isSuperAdminUser } from "@shared/super-admin-identities";

export type { EmailHubTrackingPagePayload, EmailHubTrackingInsights, EmailHubPriorityFollowUp };

const INSIGHT_WINDOW_DAYS = 30;

/** Same shape as `EmailHubApiUser` from the Email Hub session helper (kept here to avoid server→app imports). */
export type EmailHubTrackingSessionUser = {
  id: number;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  isSuperUser?: boolean;
  isSuper: boolean;
};

function superFlag(user: EmailHubTrackingSessionUser): boolean {
  return isSuperAdminUser({
    username: user.username,
    email: user.email,
    role: user.role,
    isSuperUser: user.isSuperUser,
  });
}

export async function getEmailHubUserPrefsRow(userId: number) {
  const [row] = await db.select().from(emailHubUserPrefs).where(eq(emailHubUserPrefs.userId, userId)).limit(1);
  return row ?? null;
}

export async function upsertEmailHubUserPrefs(
  userId: number,
  input: Partial<{
    defaultTrackingOpen: boolean;
    defaultTrackingClick: boolean;
    defaultUnsubFooter: boolean;
  }>,
) {
  const existing = await getEmailHubUserPrefsRow(userId);
  const defaultTrackingOpen = input.defaultTrackingOpen ?? existing?.defaultTrackingOpen ?? true;
  const defaultTrackingClick = input.defaultTrackingClick ?? existing?.defaultTrackingClick ?? true;
  const defaultUnsubFooter = input.defaultUnsubFooter ?? existing?.defaultUnsubFooter ?? false;

  await db
    .insert(emailHubUserPrefs)
    .values({
      userId,
      defaultTrackingOpen,
      defaultTrackingClick,
      defaultUnsubFooter,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: emailHubUserPrefs.userId,
      set: {
        defaultTrackingOpen,
        defaultTrackingClick,
        defaultUnsubFooter,
        updatedAt: new Date(),
      },
    });
}

export async function getEmailHubTrackingPayload(user: EmailHubTrackingSessionUser): Promise<EmailHubTrackingPagePayload> {
  const isSuper = superFlag(user);
  const since = new Date(Date.now() - INSIGHT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const sentBase = isSuper
    ? and(eq(emailHubMessages.status, "sent"), gte(emailHubMessages.sentAt, since))
    : and(
        eq(emailHubMessages.status, "sent"),
        gte(emailHubMessages.sentAt, since),
        eq(emailHubMessages.ownerUserId, user.id),
      );

  const [sentRow] = await db.select({ c: sql<number>`count(*)::int` }).from(emailHubMessages).where(sentBase);
  const sentLast30d = sentRow?.c ?? 0;

  const messagesForRates = await db.select({ id: emailHubMessages.id }).from(emailHubMessages).where(sentBase);
  const messageIds = messagesForRates.map((m) => m.id);

  let distinctOpens30d = 0;
  let distinctClicks30d = 0;
  if (messageIds.length > 0) {
    const [opens] = await db
      .select({ c: sql<number>`count(distinct ${emailHubEvents.emailMessageId})::int` })
      .from(emailHubEvents)
      .where(and(inArray(emailHubEvents.emailMessageId, messageIds), eq(emailHubEvents.eventType, "open")));
    const [clicks] = await db
      .select({ c: sql<number>`count(distinct ${emailHubEvents.emailMessageId})::int` })
      .from(emailHubEvents)
      .where(and(inArray(emailHubEvents.emailMessageId, messageIds), eq(emailHubEvents.eventType, "click")));
    distinctOpens30d = opens?.c ?? 0;
    distinctClicks30d = clicks?.c ?? 0;
  }

  const denom = messageIds.length;
  const openRatePct = denom > 0 ? Math.round(((distinctOpens30d / denom) * 1000)) / 10 : null;
  const clickRatePct = denom > 0 ? Math.round(((distinctClicks30d / denom) * 1000)) / 10 : null;
  const clickThroughOfOpensPct =
    distinctOpens30d > 0 ? Math.round(((distinctClicks30d / distinctOpens30d) * 1000)) / 10 : null;

  const bounceWhere = isSuper
    ? and(eq(emailHubEvents.eventType, "bounce"), gte(emailHubEvents.eventTimestamp, since))
    : and(
        eq(emailHubEvents.eventType, "bounce"),
        gte(emailHubEvents.eventTimestamp, since),
        sql`exists (
          select 1 from ${emailHubMessages}
          where ${emailHubMessages.id} = ${emailHubEvents.emailMessageId}
          and ${emailHubMessages.ownerUserId} = ${user.id}
        )`,
      );
  const [bounceRow] = await db.select({ c: sql<number>`count(*)::int` }).from(emailHubEvents).where(bounceWhere);

  const crmSentWhere = and(sentBase, isNotNull(emailHubMessages.relatedContactId));
  const [crmSentRow] = await db.select({ c: sql<number>`count(*)::int` }).from(emailHubMessages).where(crmSentWhere);
  const crmLinkedSent30d = crmSentRow?.c ?? 0;

  const crmMsgIds = (await db.select({ id: emailHubMessages.id }).from(emailHubMessages).where(crmSentWhere)).map(
    (r) => r.id,
  );
  let crmDistinctOpens30d = 0;
  let crmDistinctClicks30d = 0;
  if (crmMsgIds.length > 0) {
    const [o] = await db
      .select({ c: sql<number>`count(distinct ${emailHubEvents.emailMessageId})::int` })
      .from(emailHubEvents)
      .where(and(inArray(emailHubEvents.emailMessageId, crmMsgIds), eq(emailHubEvents.eventType, "open")));
    const [cl] = await db
      .select({ c: sql<number>`count(distinct ${emailHubEvents.emailMessageId})::int` })
      .from(emailHubEvents)
      .where(and(inArray(emailHubEvents.emailMessageId, crmMsgIds), eq(emailHubEvents.eventType, "click")));
    crmDistinctOpens30d = o?.c ?? 0;
    crmDistinctClicks30d = cl?.c ?? 0;
  }
  const crmDenom = crmMsgIds.length;
  const crmOpenRatePct = crmDenom > 0 ? Math.round(((crmDistinctOpens30d / crmDenom) * 1000)) / 10 : null;
  const crmClickRatePct = crmDenom > 0 ? Math.round(((crmDistinctClicks30d / crmDenom) * 1000)) / 10 : null;

  const signalWhere = isSuper
    ? and(
        inArray(emailHubEvents.eventType, ["open", "click"]),
        gte(emailHubEvents.eventTimestamp, since),
        isNotNull(emailHubMessages.relatedContactId),
      )
    : and(
        inArray(emailHubEvents.eventType, ["open", "click"]),
        gte(emailHubEvents.eventTimestamp, since),
        isNotNull(emailHubMessages.relatedContactId),
        eq(emailHubMessages.ownerUserId, user.id),
      );

  const signalRows = await db
    .select({
      eventType: emailHubEvents.eventType,
      at: emailHubEvents.eventTimestamp,
      messageId: emailHubMessages.id,
      subject: emailHubMessages.subject,
      contactId: emailHubMessages.relatedContactId,
      contactName: crmContacts.name,
      contactEmail: crmContacts.email,
      company: crmContacts.company,
      intentLevel: crmContacts.intentLevel,
      leadScore: crmContacts.leadScore,
      status: crmContacts.status,
      lifecycleStage: crmContacts.lifecycleStage,
    })
    .from(emailHubEvents)
    .innerJoin(emailHubMessages, eq(emailHubEvents.emailMessageId, emailHubMessages.id))
    .innerJoin(crmContacts, eq(emailHubMessages.relatedContactId, crmContacts.id))
    .where(signalWhere)
    .orderBy(sql`case when ${emailHubEvents.eventType} = 'click' then 0 else 1 end`, desc(emailHubEvents.eventTimestamp))
    .limit(80);

  const seenContacts = new Set<number>();
  const priorityFollowUps: EmailHubPriorityFollowUp[] = [];
  for (const row of signalRows) {
    const cid = row.contactId;
    if (cid == null || seenContacts.has(cid)) continue;
    if (row.eventType !== "open" && row.eventType !== "click") continue;
    seenContacts.add(cid);
    priorityFollowUps.push({
      contactId: cid,
      name: row.contactName,
      email: row.contactEmail,
      company: row.company ?? null,
      intentLevel: row.intentLevel ?? null,
      leadScore: row.leadScore ?? null,
      status: row.status ?? null,
      lifecycleStage: row.lifecycleStage ?? null,
      lastSignal: row.eventType === "click" ? "click" : "open",
      lastSignalAt: row.at?.toISOString() ?? "",
      messageId: row.messageId,
      subject: row.subject ?? null,
    });
    if (priorityFollowUps.length >= 12) break;
  }

  const recentEventsQuery = () =>
    db
      .select({
        id: emailHubEvents.id,
        type: emailHubEvents.eventType,
        messageId: emailHubEvents.emailMessageId,
        recipientEmail: emailHubEvents.recipientEmail,
        at: emailHubEvents.eventTimestamp,
        subject: emailHubMessages.subject,
      })
      .from(emailHubEvents)
      .innerJoin(emailHubMessages, eq(emailHubEvents.emailMessageId, emailHubMessages.id));

  const recentEvents = isSuper
    ? await recentEventsQuery().orderBy(desc(emailHubEvents.eventTimestamp)).limit(20)
    : await recentEventsQuery()
        .where(eq(emailHubMessages.ownerUserId, user.id))
        .orderBy(desc(emailHubEvents.eventTimestamp))
        .limit(20);

  const prefs = await getEmailHubUserPrefsRow(user.id);

  return {
    connection: {
      brevoApiConfigured: Boolean(process.env.BREVO_API_KEY?.trim()),
      webhookSecretConfigured: Boolean(process.env.BREVO_WEBHOOK_SECRET?.trim()),
      trackingDomain: process.env.BREVO_TRACKING_DOMAIN?.trim() ?? "",
    },
    defaults: {
      defaultTrackingOpen: prefs?.defaultTrackingOpen ?? true,
      defaultTrackingClick: prefs?.defaultTrackingClick ?? true,
      defaultUnsubFooter: prefs?.defaultUnsubFooter ?? false,
    },
    insights: {
      windowDays: INSIGHT_WINDOW_DAYS,
      sentLast30d,
      trackedMessages30d: denom,
      distinctOpens30d,
      distinctClicks30d,
      openRatePct,
      clickRatePct,
      clickThroughOfOpensPct,
      bounces30d: bounceRow?.c ?? 0,
      crmLinkedSent30d,
      crmTrackedMessages30d: crmDenom,
      crmDistinctOpens30d,
      crmDistinctClicks30d,
      crmOpenRatePct,
      crmClickRatePct,
      priorityFollowUps,
      recentActivity: recentEvents.map((e) => ({
        id: e.id,
        type: e.type,
        messageId: e.messageId,
        recipientEmail: e.recipientEmail,
        at: e.at?.toISOString() ?? "",
        subject: e.subject,
      })),
    },
  };
}
