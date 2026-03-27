import { db } from "@server/db";
import {
  emailHubMailboxAccounts,
  emailHubInboxThreads,
  emailHubInboxMessages,
} from "@shared/emailHubSchema";
import { eq, and, desc } from "drizzle-orm";

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

export async function listInboxThreads(mailboxAccountId: number, limit = 50) {
  return db
    .select()
    .from(emailHubInboxThreads)
    .where(eq(emailHubInboxThreads.mailboxAccountId, mailboxAccountId))
    .orderBy(desc(emailHubInboxThreads.lastMessageAt))
    .limit(limit);
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
