import { db } from "@server/db";
import {
  emailHubSenders,
  emailHubSenderPermissions,
  emailHubDrafts,
  emailHubMessages,
  emailHubEvents,
  emailHubTemplates,
  emailHubAssets,
} from "@shared/emailHubSchema";
import { commEmailDesigns } from "@shared/communicationsSchema";
import { eq, and, desc, sql, gte, inArray, or, isNull } from "drizzle-orm";
import { sendEmailHubViaBrevo, type BrevoRecipient } from "./emailHubBrevo";
import { userMayUseSender, listSendersForUser, type EmailHubSessionUser } from "./emailHubAccess";
import { applyEmailMergeTags, type EmailMergeFields } from "@/lib/emailMergeTags";
import { storage } from "@server/storage";
import { isSuperAdminUser, type SuperAdminUserInput } from "@shared/super-admin-identities";

export type EmailHubOverview = {
  sentToday: number;
  scheduledCount: number;
  draftCount: number;
  openRatePct: number | null;
  clickRatePct: number | null;
  bounceCount30d: number;
  replyCountManual: number;
  bySender: { senderId: number; name: string; email: string; sent: number; opens: number; clicks: number }[];
  recentActivity: {
    id: number;
    type: string;
    messageId: number;
    recipientEmail: string;
    at: string;
    subject?: string;
  }[];
};

function startOfUtcDay(d = new Date()): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export function resolveEmailHubSuperUser(user: SuperAdminUserInput | null | undefined) {
  return isSuperAdminUser(user);
}

export async function getEmailHubOverview(
  user: EmailHubSessionUser & { username?: string | null; email?: string | null; role?: string | null; isSuperUser?: boolean },
): Promise<EmailHubOverview> {
  const isSuper = resolveEmailHubSuperUser(user);
  const start = startOfUtcDay();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const sentTodayWhere = isSuper
    ? and(eq(emailHubMessages.status, "sent"), gte(emailHubMessages.sentAt, start))
    : and(
        eq(emailHubMessages.status, "sent"),
        gte(emailHubMessages.sentAt, start),
        eq(emailHubMessages.ownerUserId, user.id),
      );

  const [sentTodayRow] = await db.select({ c: sql<number>`count(*)::int` }).from(emailHubMessages).where(sentTodayWhere);

  const schedDraftWhere = isSuper
    ? eq(emailHubDrafts.status, "scheduled")
    : and(eq(emailHubDrafts.status, "scheduled"), eq(emailHubDrafts.ownerUserId, user.id));

  const [schedDraftRow] = await db.select({ c: sql<number>`count(*)::int` }).from(emailHubDrafts).where(schedDraftWhere);

  const draftWhere = isSuper
    ? eq(emailHubDrafts.status, "draft")
    : and(eq(emailHubDrafts.status, "draft"), eq(emailHubDrafts.ownerUserId, user.id));

  const [draftRow] = await db.select({ c: sql<number>`count(*)::int` }).from(emailHubDrafts).where(draftWhere);

  const msgRateWhere = isSuper
    ? and(eq(emailHubMessages.status, "sent"), gte(emailHubMessages.sentAt, since30))
    : and(
        eq(emailHubMessages.status, "sent"),
        gte(emailHubMessages.sentAt, since30),
        eq(emailHubMessages.ownerUserId, user.id),
      );

  const messagesForRates = await db.select({ id: emailHubMessages.id }).from(emailHubMessages).where(msgRateWhere);

  const messageIds = messagesForRates.map((m) => m.id);
  let openRatePct: number | null = null;
  let clickRatePct: number | null = null;
  if (messageIds.length > 0) {
    const [opens] = await db
      .select({ c: sql<number>`count(distinct ${emailHubEvents.emailMessageId})::int` })
      .from(emailHubEvents)
      .where(and(inArray(emailHubEvents.emailMessageId, messageIds), eq(emailHubEvents.eventType, "open")));
    const [clicks] = await db
      .select({ c: sql<number>`count(distinct ${emailHubEvents.emailMessageId})::int` })
      .from(emailHubEvents)
      .where(and(inArray(emailHubEvents.emailMessageId, messageIds), eq(emailHubEvents.eventType, "click")));
    const denom = messageIds.length;
    openRatePct = denom > 0 ? Math.round(((opens?.c ?? 0) / denom) * 1000) / 10 : null;
    clickRatePct = denom > 0 ? Math.round(((clicks?.c ?? 0) / denom) * 1000) / 10 : null;
  }

  const bounceWhere = isSuper
    ? and(eq(emailHubEvents.eventType, "bounce"), gte(emailHubEvents.eventTimestamp, since30))
    : and(
        eq(emailHubEvents.eventType, "bounce"),
        gte(emailHubEvents.eventTimestamp, since30),
        sql`exists (
          select 1 from ${emailHubMessages}
          where ${emailHubMessages.id} = ${emailHubEvents.emailMessageId}
          and ${emailHubMessages.ownerUserId} = ${user.id}
        )`,
      );

  const [bounceRow] = await db.select({ c: sql<number>`count(*)::int` }).from(emailHubEvents).where(bounceWhere);

  const senders = await listSendersForUser(user.id, isSuper);
  const bySender: EmailHubOverview["bySender"] = [];
  for (const s of senders.slice(0, 20)) {
    const sentQ = isSuper
      ? and(
          eq(emailHubMessages.senderId, s.id),
          eq(emailHubMessages.status, "sent"),
          gte(emailHubMessages.sentAt, since30),
        )
      : and(
          eq(emailHubMessages.senderId, s.id),
          eq(emailHubMessages.status, "sent"),
          gte(emailHubMessages.sentAt, since30),
          eq(emailHubMessages.ownerUserId, user.id),
        );
    const [sent] = await db.select({ c: sql<number>`count(*)::int` }).from(emailHubMessages).where(sentQ);
    const mids = (
      await db.select({ id: emailHubMessages.id }).from(emailHubMessages).where(sentQ)
    ).map((r) => r.id);
    let opens = 0;
    let clicks = 0;
    if (mids.length) {
      const [o] = await db
        .select({ c: sql<number>`count(distinct ${emailHubEvents.emailMessageId})::int` })
        .from(emailHubEvents)
        .where(and(inArray(emailHubEvents.emailMessageId, mids), eq(emailHubEvents.eventType, "open")));
      const [cl] = await db
        .select({ c: sql<number>`count(distinct ${emailHubEvents.emailMessageId})::int` })
        .from(emailHubEvents)
        .where(and(inArray(emailHubEvents.emailMessageId, mids), eq(emailHubEvents.eventType, "click")));
      opens = o?.c ?? 0;
      clicks = cl?.c ?? 0;
    }
    bySender.push({
      senderId: s.id,
      name: s.name,
      email: s.email,
      sent: sent?.c ?? 0,
      opens,
      clicks,
    });
  }

  const recentBase = db
    .select({
      id: emailHubEvents.id,
      type: emailHubEvents.eventType,
      messageId: emailHubEvents.emailMessageId,
      recipientEmail: emailHubEvents.recipientEmail,
      at: emailHubEvents.eventTimestamp,
      subject: emailHubMessages.subject,
    })
    .from(emailHubEvents)
    .innerJoin(emailHubMessages, eq(emailHubEvents.emailMessageId, emailHubMessages.id))
    .orderBy(desc(emailHubEvents.eventTimestamp))
    .limit(25);

  const recentEvents = isSuper ? await recentBase : await recentBase.where(eq(emailHubMessages.ownerUserId, user.id));

  const recentActivity = recentEvents.map((e) => ({
    id: e.id,
    type: e.type,
    messageId: e.messageId,
    recipientEmail: e.recipientEmail,
    at: e.at?.toISOString() ?? "",
    subject: e.subject,
  }));

  const schedMsgCount = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(emailHubMessages)
    .where(
      isSuper
        ? eq(emailHubMessages.status, "scheduled")
        : and(eq(emailHubMessages.status, "scheduled"), eq(emailHubMessages.ownerUserId, user.id)),
    );

  return {
    sentToday: sentTodayRow?.c ?? 0,
    scheduledCount: (schedDraftRow?.c ?? 0) + (schedMsgCount[0]?.c ?? 0),
    draftCount: draftRow?.c ?? 0,
    openRatePct,
    clickRatePct,
    bounceCount30d: bounceRow?.c ?? 0,
    replyCountManual: 0,
    bySender,
    recentActivity,
  };
}

export async function listEmailHubDrafts(userId: number, isSuper: boolean) {
  if (!isSuper) {
    return db
      .select()
      .from(emailHubDrafts)
      .where(eq(emailHubDrafts.ownerUserId, userId))
      .orderBy(desc(emailHubDrafts.updatedAt));
  }
  return db.select().from(emailHubDrafts).orderBy(desc(emailHubDrafts.updatedAt));
}

export async function getEmailHubDraft(id: number, userId: number, isSuper: boolean) {
  const [row] = await db.select().from(emailHubDrafts).where(eq(emailHubDrafts.id, id)).limit(1);
  if (!row) return undefined;
  if (!isSuper && row.ownerUserId !== userId) return undefined;
  return row;
}

export async function saveEmailHubDraft(
  userId: number,
  isSuper: boolean,
  input: {
    id?: number;
    senderId: number;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    htmlBody: string;
    textBody?: string | null;
    scheduledFor?: Date | null;
    status?: "draft" | "scheduled";
    templateId?: number | null;
    relatedContactId?: number | null;
  },
) {
  if (!(await userMayUseSender(userId, input.senderId, isSuper))) {
    throw new Error("Sender not allowed for this user");
  }
  const status = input.scheduledFor ? "scheduled" : input.status ?? "draft";
  if (input.id) {
    const existing = await getEmailHubDraft(input.id, userId, isSuper);
    if (!existing) throw new Error("Draft not found");
    const [updated] = await db
      .update(emailHubDrafts)
      .set({
        senderId: input.senderId,
        toJson: input.to,
        ccJson: input.cc ?? null,
        bccJson: input.bcc ?? null,
        subject: input.subject,
        htmlBody: input.htmlBody,
        textBody: input.textBody ?? null,
        scheduledFor: input.scheduledFor ?? null,
        status,
        templateId: input.templateId ?? null,
        relatedContactId: input.relatedContactId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(emailHubDrafts.id, input.id))
      .returning();
    return updated;
  }
  const [inserted] = await db
    .insert(emailHubDrafts)
    .values({
      ownerUserId: userId,
      senderId: input.senderId,
      toJson: input.to,
      ccJson: input.cc ?? null,
      bccJson: input.bcc ?? null,
      subject: input.subject,
      htmlBody: input.htmlBody,
      textBody: input.textBody ?? null,
      scheduledFor: input.scheduledFor ?? null,
      status,
      templateId: input.templateId ?? null,
      relatedContactId: input.relatedContactId ?? null,
    })
    .returning();
  return inserted;
}

export async function deleteEmailHubDraft(id: number, userId: number, isSuper: boolean) {
  const existing = await getEmailHubDraft(id, userId, isSuper);
  if (!existing) return false;
  await db.delete(emailHubDrafts).where(eq(emailHubDrafts.id, id));
  return true;
}

export async function listEmailHubMessages(userId: number, isSuper: boolean, status?: string) {
  if (status) {
    const w = isSuper
             ? eq(emailHubMessages.status, status)
             : and(eq(emailHubMessages.ownerUserId, userId), eq(emailHubMessages.status, status));
    return db.select().from(emailHubMessages).where(w).orderBy(desc(emailHubMessages.updatedAt));
  }
  if (!isSuper) {
    return db
      .select()
      .from(emailHubMessages)
      .where(eq(emailHubMessages.ownerUserId, userId))
      .orderBy(desc(emailHubMessages.updatedAt));
  }
  return db.select().from(emailHubMessages).orderBy(desc(emailHubMessages.updatedAt));
}

export async function getEmailHubMessageById(id: number, userId: number, isSuper: boolean) {
  const [row] = await db.select().from(emailHubMessages).where(eq(emailHubMessages.id, id)).limit(1);
  if (!row) return undefined;
  if (!isSuper && row.ownerUserId !== userId) return undefined;
  return row;
}

export async function getEmailHubMessageByBrevoId(brevoMessageId: string) {
  const t = brevoMessageId.trim();
  if (!t) return undefined;
  const [row] = await db
    .select()
    .from(emailHubMessages)
    .where(eq(emailHubMessages.brevoMessageId, t))
    .limit(1);
  return row ?? undefined;
}

export async function listEmailHubEventsForMessage(messageId: number) {
  return db
    .select()
    .from(emailHubEvents)
    .where(eq(emailHubEvents.emailMessageId, messageId))
    .orderBy(desc(emailHubEvents.eventTimestamp));
}

export async function appendEmailHubEvent(
  messageId: number,
  eventType: string,
  recipientEmail: string,
  providerEventId?: string | null,
  metadata?: Record<string, unknown> | null,
  at = new Date(),
) {
  await db.insert(emailHubEvents).values({
    emailMessageId: messageId,
    eventType,
    recipientEmail: recipientEmail.toLowerCase(),
    providerEventId: providerEventId ?? null,
    metadata,
    eventTimestamp: at,
  });
}

type SendNowInput = {
  userId: number;
  isSuper: boolean;
  senderId: number;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlBody: string;
  textBody?: string | null;
  draftId?: number | null;
  templateId?: number | null;
  relatedContactId?: number | null;
  scheduledFor?: Date | null;
  trackingOpen?: boolean;
  trackingClick?: boolean;
  unsubFooter?: boolean;
  merge?: EmailMergeFields | null;
};

export async function sendEmailHubNow(input: SendNowInput) {
  if (!(await userMayUseSender(input.userId, input.senderId, input.isSuper))) {
    throw new Error("Sender not allowed for this user");
  }
  const [sender] = await db
    .select()
    .from(emailHubSenders)
    .where(eq(emailHubSenders.id, input.senderId))
    .limit(1);
  if (!sender) throw new Error("Sender not found");

  let html = input.htmlBody;
  let subj = input.subject;
  if (input.merge) {
    html = applyEmailMergeTags(html, input.merge, { htmlEscape: true });
    subj = applyEmailMergeTags(subj, input.merge, { htmlEscape: false });
  }
  if (sender.signatureHtml?.trim()) {
    html = `${html}<br/><br/>${sender.signatureHtml}`;
  }

  if (input.scheduledFor && input.scheduledFor.getTime() > Date.now()) {
    const [msg] = await db
      .insert(emailHubMessages)
      .values({
        ownerUserId: input.userId,
        senderId: input.senderId,
        toJson: input.to,
        ccJson: input.cc ?? null,
        bccJson: input.bcc ?? null,
        subject: subj,
        htmlBody: html,
        textBody: input.textBody ?? null,
        status: "scheduled",
        scheduledFor: input.scheduledFor,
        templateId: input.templateId ?? null,
        relatedContactId: input.relatedContactId ?? null,
        trackingOpen: input.trackingOpen ?? true,
        trackingClick: input.trackingClick ?? true,
        unsubFooter: input.unsubFooter ?? false,
      })
      .returning();
    if (input.draftId) await deleteEmailHubDraft(input.draftId, input.userId, input.isSuper);
    return { ok: true as const, scheduled: true, message: msg };
  }

  const [msg] = await db
    .insert(emailHubMessages)
    .values({
      ownerUserId: input.userId,
      senderId: input.senderId,
      toJson: input.to,
      ccJson: input.cc ?? null,
      bccJson: input.bcc ?? null,
      subject: subj,
      htmlBody: html,
      textBody: input.textBody ?? null,
      status: "pending",
      templateId: input.templateId ?? null,
      relatedContactId: input.relatedContactId ?? null,
      trackingOpen: input.trackingOpen ?? true,
      trackingClick: input.trackingClick ?? true,
      unsubFooter: input.unsubFooter ?? false,
    })
    .returning();

  const toRecipients: BrevoRecipient[] = input.to.map((e) => ({ email: e }));
  const ccRecipients: BrevoRecipient[] | undefined = input.cc?.length
    ? input.cc.map((e) => ({ email: e }))
    : undefined;
  const bccRecipients: BrevoRecipient[] | undefined = input.bcc?.length
    ? input.bcc.map((e) => ({ email: e }))
    : undefined;

  const replyTo =
    sender.replyToEmail?.trim() ?
      { email: sender.replyToEmail.trim(), name: sender.replyToName ?? undefined }
    : undefined;

  const brevo = await sendEmailHubViaBrevo({
    to: toRecipients,
    cc: ccRecipients,
    bcc: bccRecipients,
    subject: subj,
    htmlContent: html,
    textContent: input.textBody ?? undefined,
    sender: { email: sender.email.trim(), name: sender.name.trim() },
    replyTo,
    emailHubMessageId: msg!.id,
    trackingOpen: input.trackingOpen ?? true,
    trackingClick: input.trackingClick ?? true,
  });

  if (!brevo.ok) {
    await db
      .update(emailHubMessages)
      .set({
        status: "failed",
        errorMessage: brevo.error,
        updatedAt: new Date(),
      })
      .where(eq(emailHubMessages.id, msg!.id));
    return { ok: false as const, error: brevo.error, message: msg };
  }

  await db
    .update(emailHubMessages)
    .set({
      status: "sent",
      brevoMessageId: brevo.messageId,
      sentAt: new Date(),
      updatedAt: new Date(),
      providerJson: { brevoMessageId: brevo.messageId },
    })
    .where(eq(emailHubMessages.id, msg!.id));

  if (input.relatedContactId) {
    try {
      await storage.createCommunicationEvent({
        leadId: input.relatedContactId,
        eventType: "delivered",
        emailId: `emailhub-${msg!.id}`,
        metadata: { source: "email_hub", subject: subj.slice(0, 300) },
      });
    } catch {
      /* optional */
    }
  }

  if (input.draftId) await deleteEmailHubDraft(input.draftId, input.userId, input.isSuper);

  return {
    ok: true as const,
    scheduled: false,
    messageId: msg!.id,
    brevoMessageId: brevo.messageId,
  };
}

export async function processScheduledEmailHubMessages() {
  const now = new Date();
  const rows = await db
    .select()
    .from(emailHubMessages)
    .where(and(eq(emailHubMessages.status, "scheduled"), sql`${emailHubMessages.scheduledFor} <= ${now}`));

  for (const msg of rows) {
    const [sender] = await db
      .select()
      .from(emailHubSenders)
      .where(eq(emailHubSenders.id, msg.senderId))
      .limit(1);
    if (!sender) continue;
    const html = msg.htmlBody;
    const toRecipients: BrevoRecipient[] = msg.toJson.map((e: string) => ({ email: e }));
    const ccRecipients = msg.ccJson?.length ? msg.ccJson.map((e: string) => ({ email: e })) : undefined;
    const bccRecipients = msg.bccJson?.length ? msg.bccJson.map((e: string) => ({ email: e })) : undefined;
    const replyTo =
      sender.replyToEmail?.trim() ?
        { email: sender.replyToEmail.trim(), name: sender.replyToName ?? undefined }
      : undefined;

    const brevo = await sendEmailHubViaBrevo({
      to: toRecipients,
      cc: ccRecipients,
      bcc: bccRecipients,
      subject: msg.subject,
      htmlContent: html,
      textContent: msg.textBody ?? undefined,
      sender: { email: sender.email.trim(), name: sender.name.trim() },
      replyTo,
      emailHubMessageId: msg.id,
      trackingOpen: msg.trackingOpen,
      trackingClick: msg.trackingClick,
    });

    if (brevo.ok) {
      await db
        .update(emailHubMessages)
        .set({
          status: "sent",
          brevoMessageId: brevo.messageId,
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailHubMessages.id, msg.id));
    } else {
      await db
        .update(emailHubMessages)
        .set({
          status: "failed",
          errorMessage: brevo.error,
          updatedAt: new Date(),
        })
        .where(eq(emailHubMessages.id, msg.id));
    }
  }
  return { processed: rows.length };
}

export async function processScheduledEmailHubDrafts() {
  const now = new Date();
  const drafts = await db
    .select()
    .from(emailHubDrafts)
    .where(and(eq(emailHubDrafts.status, "scheduled"), sql`${emailHubDrafts.scheduledFor} <= ${now}`));

  for (const d of drafts) {
    await sendEmailHubNow({
      userId: d.ownerUserId,
      isSuper: false,
      senderId: d.senderId,
      to: d.toJson,
      cc: d.ccJson ?? undefined,
      bcc: d.bccJson ?? undefined,
      subject: d.subject,
      htmlBody: d.htmlBody,
      textBody: d.textBody,
      draftId: d.id,
      templateId: d.templateId,
      relatedContactId: d.relatedContactId,
    });
  }
  return { draftsProcessed: drafts.length };
}

/** Super-only: create sender + optional permission for a user. */
export async function adminUpsertEmailHubSender(input: {
  id?: number;
  founderUserId?: number | null;
  brevoSenderId?: string | null;
  name: string;
  email: string;
  replyToEmail?: string | null;
  replyToName?: string | null;
  isVerified?: boolean;
  isDefault?: boolean;
  signatureHtml?: string | null;
  brandProfileId?: number | null;
  grantUserId?: number | null;
}) {
  if (input.id) {
    const [u] = await db
      .update(emailHubSenders)
      .set({
        founderUserId: input.founderUserId ?? null,
        brevoSenderId: input.brevoSenderId ?? null,
        name: input.name,
        email: input.email,
        replyToEmail: input.replyToEmail ?? null,
        replyToName: input.replyToName ?? null,
        isVerified: input.isVerified ?? false,
        isDefault: input.isDefault ?? false,
        signatureHtml: input.signatureHtml ?? null,
        brandProfileId: input.brandProfileId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(emailHubSenders.id, input.id))
      .returning();
    if (input.grantUserId && u) {
      try {
        await db.insert(emailHubSenderPermissions).values({ userId: input.grantUserId, emailSenderId: u.id });
      } catch {
        /* duplicate */
      }
    }
    return u;
  }
  const [ins] = await db
    .insert(emailHubSenders)
    .values({
      founderUserId: input.founderUserId ?? null,
      brevoSenderId: input.brevoSenderId ?? null,
      name: input.name,
      email: input.email,
      replyToEmail: input.replyToEmail ?? null,
      replyToName: input.replyToName ?? null,
      isVerified: input.isVerified ?? false,
      isDefault: input.isDefault ?? false,
      signatureHtml: input.signatureHtml ?? null,
      brandProfileId: input.brandProfileId ?? null,
    })
    .returning();
  if (input.grantUserId && ins) {
    try {
      await db.insert(emailHubSenderPermissions).values({ userId: input.grantUserId, emailSenderId: ins.id });
    } catch {
      /* duplicate permission */
    }
  }
  return ins;
}

export async function grantSenderPermission(userId: number, emailSenderId: number) {
  await db.insert(emailHubSenderPermissions).values({ userId, emailSenderId });
}

export async function listEmailHubTemplates(userId: number, isSuper: boolean) {
  if (isSuper) return db.select().from(emailHubTemplates).orderBy(desc(emailHubTemplates.updatedAt));
  return db
    .select()
    .from(emailHubTemplates)
    .where(
      or(
        eq(emailHubTemplates.ownerUserId, userId),
        eq(emailHubTemplates.accessScope, "org"),
        eq(emailHubTemplates.accessScope, "global"),
      ),
    )
    .orderBy(desc(emailHubTemplates.updatedAt));
}

export async function saveEmailHubTemplate(
  userId: number,
  isSuper: boolean,
  row: {
    id?: number;
    name: string;
    category?: string;
    subjectTemplate: string;
    htmlTemplate: string;
    textTemplate?: string | null;
    accessScope?: string;
    commEmailDesignId?: number | null;
  },
) {
  if (row.id) {
    const [existing] = await db.select().from(emailHubTemplates).where(eq(emailHubTemplates.id, row.id)).limit(1);
    if (!existing) throw new Error("Not found");
    if (!isSuper && existing.ownerUserId !== userId) throw new Error("Forbidden");
    const [u] = await db
      .update(emailHubTemplates)
      .set({
        name: row.name,
        category: row.category ?? existing.category,
        subjectTemplate: row.subjectTemplate,
        htmlTemplate: row.htmlTemplate,
        textTemplate: row.textTemplate ?? null,
        accessScope: row.accessScope ?? existing.accessScope,
        commEmailDesignId: row.commEmailDesignId ?? existing.commEmailDesignId,
        updatedAt: new Date(),
        version: existing.version + 1,
      })
      .where(eq(emailHubTemplates.id, row.id))
      .returning();
    return u;
  }
  const [ins] = await db
    .insert(emailHubTemplates)
    .values({
      ownerUserId: userId,
      name: row.name,
      category: row.category ?? "general",
      subjectTemplate: row.subjectTemplate,
      htmlTemplate: row.htmlTemplate,
      textTemplate: row.textTemplate ?? null,
      accessScope: row.accessScope ?? "private",
      commEmailDesignId: row.commEmailDesignId ?? null,
    })
    .returning();
  return ins;
}

export async function listEmailHubAssets(userId: number, isSuper: boolean) {
  if (isSuper) return db.select().from(emailHubAssets).orderBy(desc(emailHubAssets.updatedAt));
  return db
    .select()
    .from(emailHubAssets)
    .where(or(isNull(emailHubAssets.ownerUserId), eq(emailHubAssets.ownerUserId, userId)))
    .orderBy(desc(emailHubAssets.updatedAt));
}

export async function createEmailHubAsset(row: {
  ownerUserId?: number | null;
  brandProfileId?: number | null;
  name: string;
  fileUrl: string;
  mimeType?: string | null;
  altText?: string | null;
  tags?: string[];
  category?: string | null;
}) {
  const [ins] = await db
    .insert(emailHubAssets)
    .values({
      ownerUserId: row.ownerUserId ?? null,
      brandProfileId: row.brandProfileId ?? null,
      name: row.name,
      fileUrl: row.fileUrl,
      mimeType: row.mimeType ?? null,
      altText: row.altText ?? null,
      tags: row.tags ?? [],
      category: row.category ?? "general",
    })
    .returning();
  return ins;
}

/** Merges Communications designs as read-only templates (no duplicate editor). */
export async function listCommunicationsDesignsAsTemplates() {
  return db
    .select({
      id: commEmailDesigns.id,
      name: commEmailDesigns.name,
      subject: commEmailDesigns.subject,
      category: commEmailDesigns.category,
      updatedAt: commEmailDesigns.updatedAt,
    })
    .from(commEmailDesigns)
    .orderBy(desc(commEmailDesigns.updatedAt));
}

export { listSendersForUser };
