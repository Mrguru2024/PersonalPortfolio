import { db } from "@server/db";
import type { EmailHubInboxMessage } from "@shared/emailHubSchema";
import { emailHubInboxThreads, emailHubInboxMessages } from "@shared/emailHubSchema";
import { eq, and } from "drizzle-orm";
import { getMailboxAccountById, getInboxThreadById, listThreadMessages } from "./emailHubMailboxAccess";
import { getMailboxAccessToken } from "./emailHubMailboxTokens";

function base64UrlEncodeUtf8(text: string): string {
  return Buffer.from(text, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function replySubject(original: string): string {
  const t = original.trim();
  if (/^re:\s/i.test(t)) return t;
  return `Re: ${t}`;
}

function resolveReplyRecipient(latest: EmailHubInboxMessage, mailboxEmail: string): string | null {
  const me = mailboxEmail.toLowerCase();
  const from = latest.fromEmail?.toLowerCase();
  if (from && from !== me) return latest.fromEmail!;
  for (const t of latest.toJson) {
    if (t.email.toLowerCase() !== me) return t.email;
  }
  return latest.fromEmail || null;
}

function buildRfc822Html(params: {
  from: string;
  fromName: string | null;
  to: string;
  subject: string;
  inReplyTo: string | null;
  references: string | null;
  html: string;
}): string {
  const lines: string[] = [];
  const fromLine =
    params.fromName ? `${params.fromName.replace(/"/g, '\\"')} <${params.from}>` : `<${params.from}>`;
  lines.push(`From: ${fromLine}`);
  lines.push(`To: ${params.to}`);
  lines.push(`Subject: ${params.subject}`);
  if (params.inReplyTo) lines.push(`In-Reply-To: ${params.inReplyTo}`);
  if (params.references) lines.push(`References: ${params.references}`);
  lines.push("MIME-Version: 1.0");
  lines.push('Content-Type: text/html; charset="UTF-8"');
  lines.push("Content-Transfer-Encoding: base64");
  lines.push("");
  lines.push(Buffer.from(params.html, "utf8").toString("base64"));
  return lines.join("\r\n");
}

async function gmailSendRawInThread(
  accessToken: string,
  rfc822: string,
  gmailThreadId: string,
): Promise<void> {
  const raw = base64UrlEncodeUtf8(rfc822);
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw, threadId: gmailThreadId }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
}

async function graphReplyToMessage(accessToken: string, graphMessageId: string, html: string): Promise<void> {
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(graphMessageId)}/reply`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        body: { contentType: "HTML", content: html },
      },
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
}

async function gmailModifyThread(accessToken: string, gmailThreadId: string, add: string[], remove: string[]) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${encodeURIComponent(gmailThreadId)}/modify`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ addLabelIds: add, removeLabelIds: remove }),
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(await res.text());
}

async function gmailModifyMessage(accessToken: string, messageId: string, add: string[], remove: string[]) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}/modify`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ addLabelIds: add, removeLabelIds: remove }),
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(await res.text());
}

async function graphPatchMessageRead(accessToken: string, graphMessageId: string, isRead: boolean) {
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(graphMessageId)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ isRead }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
}

async function applyLocalThreadReadState(
  internalThreadId: number,
  mailboxAccountId: number,
  isRead: boolean,
): Promise<void> {
  await db
    .update(emailHubInboxThreads)
    .set({ isRead, updatedAt: new Date() })
    .where(
      and(eq(emailHubInboxThreads.id, internalThreadId), eq(emailHubInboxThreads.mailboxAccountId, mailboxAccountId)),
    );
  await db
    .update(emailHubInboxMessages)
    .set({ isRead, updatedAt: new Date() })
    .where(
      and(eq(emailHubInboxMessages.threadId, internalThreadId), eq(emailHubInboxMessages.mailboxAccountId, mailboxAccountId)),
    );
}

async function applyLocalMessageReadStateByProviderId(
  mailboxAccountId: number,
  providerMessageId: string,
  isRead: boolean,
): Promise<number | null> {
  const [updated] = await db
    .update(emailHubInboxMessages)
    .set({ isRead, updatedAt: new Date() })
    .where(
      and(
        eq(emailHubInboxMessages.mailboxAccountId, mailboxAccountId),
        eq(emailHubInboxMessages.providerMessageId, providerMessageId),
      ),
    )
    .returning({ threadId: emailHubInboxMessages.threadId });
  return updated?.threadId ?? null;
}

async function refreshThreadReadAggregate(internalThreadId: number, mailboxAccountId: number): Promise<void> {
  const msgs = await db
    .select({ isRead: emailHubInboxMessages.isRead })
    .from(emailHubInboxMessages)
    .where(
      and(
        eq(emailHubInboxMessages.threadId, internalThreadId),
        eq(emailHubInboxMessages.mailboxAccountId, mailboxAccountId),
      ),
    );
  const anyUnread = msgs.some((m) => !m.isRead);
  await db
    .update(emailHubInboxThreads)
    .set({ isRead: !anyUnread, updatedAt: new Date() })
    .where(
      and(eq(emailHubInboxThreads.id, internalThreadId), eq(emailHubInboxThreads.mailboxAccountId, mailboxAccountId)),
    );
}

export async function replyToEmailHubThread(params: {
  mailboxAccountId: number;
  threadId: number;
  htmlBody: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const account = await getMailboxAccountById(params.mailboxAccountId);
  if (!account?.enabled) return { ok: false, error: "Mailbox not found" };
  const thread = await getInboxThreadById(params.threadId, params.mailboxAccountId);
  if (!thread) return { ok: false, error: "Thread not found" };

  const messages = await listThreadMessages(params.threadId, params.mailboxAccountId);
  if (messages.length === 0) return { ok: false, error: "Thread has no messages" };
  const latest = messages[messages.length - 1]!;
  const recipient = resolveReplyRecipient(latest, account.emailAddress);
  if (!recipient) return { ok: false, error: "Could not resolve reply recipient" };

  try {
    const { accessToken } = await getMailboxAccessToken(account);
    if (account.provider === "gmail") {
      const subj = replySubject(thread.subject || latest.subject || "");
      const inReplyTo = latest.rfcMessageId ? (latest.rfcMessageId.startsWith("<") ? latest.rfcMessageId : `<${latest.rfcMessageId}>`) : null;
      const refs = inReplyTo;
      const rfc = buildRfc822Html({
        from: account.emailAddress,
        fromName: account.displayName,
        to: recipient,
        subject: subj,
        inReplyTo,
        references: refs,
        html: params.htmlBody,
      });
      await gmailSendRawInThread(accessToken, rfc, thread.providerThreadId);
      return { ok: true };
    }
    if (account.provider === "microsoft") {
      await graphReplyToMessage(accessToken, latest.providerMessageId, params.htmlBody);
      return { ok: true };
    }
    return { ok: false, error: `Unknown provider: ${account.provider}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function setEmailHubProviderThreadReadState(params: {
  mailboxAccountId: number;
  internalThreadId: number;
  isRead: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const account = await getMailboxAccountById(params.mailboxAccountId);
  if (!account?.enabled) return { ok: false, error: "Mailbox not found" };
  const thread = await getInboxThreadById(params.internalThreadId, params.mailboxAccountId);
  if (!thread) return { ok: false, error: "Thread not found" };
  const messages = await listThreadMessages(params.internalThreadId, params.mailboxAccountId);

  try {
    const { accessToken } = await getMailboxAccessToken(account);
    if (account.provider === "gmail") {
      if (params.isRead) {
        await gmailModifyThread(accessToken, thread.providerThreadId, [], ["UNREAD"]);
      } else {
        await gmailModifyThread(accessToken, thread.providerThreadId, ["UNREAD"], []);
      }
      await applyLocalThreadReadState(params.internalThreadId, params.mailboxAccountId, params.isRead);
      return { ok: true };
    }
    if (account.provider === "microsoft") {
      for (const m of messages) {
        await graphPatchMessageRead(accessToken, m.providerMessageId, params.isRead);
      }
      await applyLocalThreadReadState(params.internalThreadId, params.mailboxAccountId, params.isRead);
      return { ok: true };
    }
    return { ok: false, error: `Unknown provider: ${account.provider}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function setEmailHubProviderMessageReadState(params: {
  mailboxAccountId: number;
  providerMessageId: string;
  isRead: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const account = await getMailboxAccountById(params.mailboxAccountId);
  if (!account?.enabled) return { ok: false, error: "Mailbox not found" };

  try {
    const { accessToken } = await getMailboxAccessToken(account);
    if (account.provider === "gmail") {
      if (params.isRead) {
        await gmailModifyMessage(accessToken, params.providerMessageId, [], ["UNREAD"]);
      } else {
        await gmailModifyMessage(accessToken, params.providerMessageId, ["UNREAD"], []);
      }
      const tid = await applyLocalMessageReadStateByProviderId(
        params.mailboxAccountId,
        params.providerMessageId,
        params.isRead,
      );
      if (tid != null) await refreshThreadReadAggregate(tid, params.mailboxAccountId);
      return { ok: true };
    }
    if (account.provider === "microsoft") {
      await graphPatchMessageRead(accessToken, params.providerMessageId, params.isRead);
      const tid = await applyLocalMessageReadStateByProviderId(
        params.mailboxAccountId,
        params.providerMessageId,
        params.isRead,
      );
      if (tid != null) await refreshThreadReadAggregate(tid, params.mailboxAccountId);
      return { ok: true };
    }
    return { ok: false, error: `Unknown provider: ${account.provider}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
