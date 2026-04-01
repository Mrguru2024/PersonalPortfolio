/**
 * Purges old synced inbox messages for non-archived threads. Archived threads keep all messages.
 */
import { db } from "@server/db";
import { emailHubInboxMessages, emailHubInboxThreads } from "@shared/emailHubSchema";
import { and, eq, lt, inArray, sql } from "drizzle-orm";
import { EMAIL_HUB_INBOX_RETENTION_DAYS } from "@server/services/emailHub/emailHubLimits";

const DELETE_CHUNK = 400;

export async function purgeEmailHubInboxPastRetention(): Promise<{
  deletedMessages: number;
  deletedThreads: number;
}> {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - EMAIL_HUB_INBOX_RETENTION_DAYS);

  const rows = await db
    .select({ id: emailHubInboxMessages.id })
    .from(emailHubInboxMessages)
    .innerJoin(emailHubInboxThreads, eq(emailHubInboxMessages.threadId, emailHubInboxThreads.id))
    .where(and(eq(emailHubInboxThreads.isArchived, false), lt(emailHubInboxMessages.internalDate, cutoff)));

  const ids = rows.map((r) => r.id);
  let deletedMessages = 0;
  for (let i = 0; i < ids.length; i += DELETE_CHUNK) {
    const chunk = ids.slice(i, i + DELETE_CHUNK);
    if (chunk.length === 0) continue;
    await db.delete(emailHubInboxMessages).where(inArray(emailHubInboxMessages.id, chunk));
    deletedMessages += chunk.length;
  }

  const threadsWithMsg = await db
    .select({ threadId: emailHubInboxMessages.threadId })
    .from(emailHubInboxMessages)
    .groupBy(emailHubInboxMessages.threadId);
  const active = new Set(threadsWithMsg.map((r) => r.threadId));

  const allThreads = await db.select({ id: emailHubInboxThreads.id }).from(emailHubInboxThreads);
  const orphanIds = allThreads.map((t) => t.id).filter((id) => !active.has(id));

  let deletedThreads = 0;
  for (let i = 0; i < orphanIds.length; i += DELETE_CHUNK) {
    const chunk = orphanIds.slice(i, i + DELETE_CHUNK);
    if (chunk.length === 0) continue;
    await db.delete(emailHubInboxThreads).where(inArray(emailHubInboxThreads.id, chunk));
    deletedThreads += chunk.length;
  }

  return { deletedMessages, deletedThreads };
}

/** Approximate bytes used by synced inbox bodies for one mailbox (for admin UI). */
export async function estimateInboxMailboxBytes(mailboxAccountId: number): Promise<{
  messageCount: number;
  approxBodyBytes: number;
}> {
  const [row] = await db
    .select({
      messageCount: sql<number>`count(*)::int`,
      approxBodyBytes: sql<number>`coalesce(sum(char_length(coalesce(${emailHubInboxMessages.htmlBody}, '')) + char_length(coalesce(${emailHubInboxMessages.snippet}, ''))), 0)::int`,
    })
    .from(emailHubInboxMessages)
    .where(eq(emailHubInboxMessages.mailboxAccountId, mailboxAccountId));

  return {
    messageCount: Number(row?.messageCount ?? 0),
    approxBodyBytes: Number(row?.approxBodyBytes ?? 0),
  };
}
