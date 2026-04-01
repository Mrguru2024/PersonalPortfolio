import { db } from "@server/db";
import {
  emailHubMailboxAccounts,
  emailHubInboxThreads,
  emailHubInboxMessages,
} from "@shared/emailHubSchema";
import { eq, and, desc, or, ilike, sql } from "drizzle-orm";
import {
  EMAIL_HUB_INBOX_LIST_DEFAULT_LIMIT,
  EMAIL_HUB_INBOX_LIST_MAX_LIMIT,
} from "@server/services/emailHub/emailHubLimits";

export async function getMailboxAccountById(id: number) {
  const [row] = await db.select().from(emailHubMailboxAccounts).where(eq(emailHubMailboxAccounts.id, id)).limit(1);
  return row ?? null;
}

export async function userMayAccessMailbox(mailboxAccountId: number, userId: number, isSuper: boolean): Promise<boolean> {
  if (isSuper) return true;
  const row = await getMailboxAccountById(mailboxAccountId);
  return row?.userId === userId;
}

export async function listMailboxAccountsForUser(userId: number, isSuper: boolean) {
  if (isSuper) {
    return db.select().from(emailHubMailboxAccounts).orderBy(desc(emailHubMailboxAccounts.updatedAt));
  }
  return db
    .select()
    .from(emailHubMailboxAccounts)
    .where(eq(emailHubMailboxAccounts.userId, userId))
    .orderBy(desc(emailHubMailboxAccounts.updatedAt));
}

export async function deleteMailboxAccountCascade(mailboxAccountId: number) {
  await db.delete(emailHubInboxMessages).where(eq(emailHubInboxMessages.mailboxAccountId, mailboxAccountId));
  await db.delete(emailHubInboxThreads).where(eq(emailHubInboxThreads.mailboxAccountId, mailboxAccountId));
  await db.delete(emailHubMailboxAccounts).where(eq(emailHubMailboxAccounts.id, mailboxAccountId));
}

export type InboxThreadListFilters = {
  /** Subject or snippet (case-insensitive) */
  q?: string;
  unreadOnly?: boolean;
  /** Default: exclude archived (main inbox). */
  archived?: "exclude" | "only" | "all";
  /** Match participant email substring */
  fromEmail?: string;
  limit?: number;
};

export async function listInboxThreads(
  mailboxAccountId: number,
  limitOrFilters: number | InboxThreadListFilters = EMAIL_HUB_INBOX_LIST_DEFAULT_LIMIT,
): Promise<(typeof emailHubInboxThreads.$inferSelect)[]> {
  const filters: InboxThreadListFilters =
    typeof limitOrFilters === "number" ? { limit: limitOrFilters } : limitOrFilters;

  const limit = Math.min(
    Math.max(1, filters.limit ?? EMAIL_HUB_INBOX_LIST_DEFAULT_LIMIT),
    EMAIL_HUB_INBOX_LIST_MAX_LIMIT,
  );

  const conditions = [eq(emailHubInboxThreads.mailboxAccountId, mailboxAccountId)];

  if (filters.archived === "only") {
    conditions.push(eq(emailHubInboxThreads.isArchived, true));
  } else if (filters.archived !== "all") {
    conditions.push(eq(emailHubInboxThreads.isArchived, false));
  }

  if (filters.unreadOnly) {
    conditions.push(eq(emailHubInboxThreads.isRead, false));
  }

  const q = filters.q?.trim().slice(0, 120);
  if (q) {
    const pat = `%${q}%`;
    conditions.push(
      or(ilike(emailHubInboxThreads.subject, pat), ilike(emailHubInboxThreads.snippet, pat))!,
    );
  }

  const from = filters.fromEmail?.trim().toLowerCase().slice(0, 320);
  if (from) {
    conditions.push(sql`${emailHubInboxThreads.participantEmailsJson}::text ilike ${"%" + from + "%"}`);
  }

  return db
    .select()
    .from(emailHubInboxThreads)
    .where(and(...conditions))
    .orderBy(desc(emailHubInboxThreads.lastMessageAt))
    .limit(limit);
}

export async function setInboxThreadArchived(
  threadId: number,
  mailboxAccountId: number,
  archived: boolean,
): Promise<boolean> {
  const now = new Date();
  const [updated] = await db
    .update(emailHubInboxThreads)
    .set({
      isArchived: archived,
      archivedAt: archived ? now : null,
      updatedAt: now,
    })
    .where(and(eq(emailHubInboxThreads.id, threadId), eq(emailHubInboxThreads.mailboxAccountId, mailboxAccountId)))
    .returning({ id: emailHubInboxThreads.id });
  return !!updated;
}

export async function getInboxThreadById(threadId: number, mailboxAccountId: number) {
  const [row] = await db
    .select()
    .from(emailHubInboxThreads)
    .where(and(eq(emailHubInboxThreads.id, threadId), eq(emailHubInboxThreads.mailboxAccountId, mailboxAccountId)))
    .limit(1);
  return row ?? null;
}

export async function listThreadMessages(threadId: number, mailboxAccountId: number) {
  return db
    .select()
    .from(emailHubInboxMessages)
    .where(
      and(eq(emailHubInboxMessages.threadId, threadId), eq(emailHubInboxMessages.mailboxAccountId, mailboxAccountId)),
    )
    .orderBy(emailHubInboxMessages.internalDate);
}

export async function getInboxMessageById(messageId: number, mailboxAccountId: number) {
  const [row] = await db
    .select()
    .from(emailHubInboxMessages)
    .where(
      and(eq(emailHubInboxMessages.id, messageId), eq(emailHubInboxMessages.mailboxAccountId, mailboxAccountId)),
    )
    .limit(1);
  return row ?? null;
}
