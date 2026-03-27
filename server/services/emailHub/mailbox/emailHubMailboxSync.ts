import { db } from "@server/db";
import {
  emailHubMailboxAccounts,
  emailHubInboxThreads,
  emailHubInboxMessages,
} from "@shared/emailHubSchema";
import { eq } from "drizzle-orm";
import { getMailboxAccountById } from "./emailHubMailboxAccess";
import { getMailboxAccessToken } from "./emailHubMailboxTokens";

const MAX_THREADS = 40;
const MAX_HTML_BYTES = 400_000;

function clampHtml(html: string | null): string | null {
  if (!html) return null;
  if (html.length <= MAX_HTML_BYTES) return html;
  return `${html.slice(0, MAX_HTML_BYTES)}\n<!-- truncated -->`;
}

type GmailPart = {
  mimeType?: string;
  body?: { data?: string; attachmentId?: string };
  parts?: GmailPart[];
};

function decodeGmailBodyData(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function extractHtmlFromGmailPart(part: GmailPart | undefined): string | null {
  if (!part) return null;
  if (part.mimeType === "text/html" && part.body?.data) {
    try {
      return decodeGmailBodyData(part.body.data);
    } catch {
      return null;
    }
  }
  if (Array.isArray(part.parts)) {
    for (const p of part.parts) {
      const h = extractHtmlFromGmailPart(p);
      if (h) return h;
    }
  }
  return null;
}

function gmailHeaders(
  headers: Array<{ name?: string; value?: string }> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const h = headers.find((x) => (x.name || "").toLowerCase() === name.toLowerCase());
  return h?.value;
}

function parseEmailList(fromHeader: string | undefined): { email: string; name?: string }[] {
  if (!fromHeader?.trim()) return [];
  const out: { email: string; name?: string }[] = [];
  for (const piece of fromHeader.split(",")) {
    const m = piece.match(/^(?:"?([^"]*)"?\s*)?<?([^>\s]+@[^>\s]+)>?$/);
    if (m) {
      const name = m[1]?.trim();
      const email = m[2]?.trim().toLowerCase();
      if (email) out.push({ email, name: name || undefined });
    }
  }
  return out;
}

async function gmailApi<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Gmail ${path}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

type GmailThreadFull = {
  id: string;
  snippet?: string;
  labelIds?: string[];
  messages?: Array<{
    id: string;
    labelIds?: string[];
    internalDate?: string;
    snippet?: string;
    payload?: { headers?: { name: string; value: string }[]; parts?: GmailPart[]; mimeType?: string; body?: { data?: string } };
  }>;
};

async function syncGmailInbox(mailboxAccountId: number, accessToken: string): Promise<void> {
  const list = await gmailApi<{ threads?: { id: string }[] }>(
    accessToken,
    `/threads?q=${encodeURIComponent("in:inbox")}&maxResults=${MAX_THREADS}`,
  );
  const threadIds = (list.threads || []).map((t) => t.id);

  for (const tid of threadIds) {
    const thread = await gmailApi<GmailThreadFull>(accessToken, `/threads/${encodeURIComponent(tid)}?format=full`);
    const messages = (thread.messages || []).slice().sort((a, b) => {
      const ia = a.internalDate ? parseInt(a.internalDate, 10) : 0;
      const ib = b.internalDate ? parseInt(b.internalDate, 10) : 0;
      return ia - ib;
    });
    if (messages.length === 0) continue;

    const participants = new Set<string>();
    let lastMs = 0;
    let subject = "";
    for (const msg of messages) {
      const headers = msg.payload?.headers;
      const from = gmailHeaders(headers, "From");
      const to = gmailHeaders(headers, "To");
      for (const p of parseEmailList(from)) participants.add(p.email);
      for (const p of parseEmailList(to)) participants.add(p.email);
      const sub = gmailHeaders(headers, "Subject");
      if (sub && !subject) subject = sub; // first chronologically
      if (msg.internalDate) {
        const ms = parseInt(msg.internalDate, 10);
        if (!Number.isNaN(ms)) lastMs = Math.max(lastMs, ms);
      }
    }
    const threadUnread = thread.labelIds?.includes("UNREAD") ?? false;
    const lastAt = lastMs ? new Date(lastMs) : new Date();

    const [threadRow] = await db
      .insert(emailHubInboxThreads)
      .values({
        mailboxAccountId,
        provider: "gmail",
        providerThreadId: thread.id,
        subject: subject || "(no subject)",
        snippet: thread.snippet ?? "",
        lastMessageAt: lastAt,
        isRead: !threadUnread,
        participantEmailsJson: [...participants],
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [emailHubInboxThreads.mailboxAccountId, emailHubInboxThreads.providerThreadId],
        set: {
          subject: subject || "(no subject)",
          snippet: thread.snippet ?? "",
          lastMessageAt: lastAt,
          isRead: !threadUnread,
          participantEmailsJson: [...participants],
          updatedAt: new Date(),
        },
      })
      .returning({ id: emailHubInboxThreads.id });

    const threadId = threadRow?.id;
    if (threadId == null) continue;

    for (const msg of messages) {
      const headers = msg.payload?.headers;
      const fromH = gmailHeaders(headers, "From");
      const toH = gmailHeaders(headers, "To");
      const subj = gmailHeaders(headers, "Subject") || subject || "";
      const mid = gmailHeaders(headers, "Message-ID") || null;
      const fromParsed = parseEmailList(fromH)[0];
      const internalMs = msg.internalDate ? parseInt(msg.internalDate, 10) : 0;
      const internalDate = !Number.isNaN(internalMs) && internalMs ? new Date(internalMs) : lastAt;
      const html =
        extractHtmlFromGmailPart(msg.payload as GmailPart) ||
        (msg.payload?.mimeType === "text/html" && msg.payload.body?.data ?
          decodeGmailBodyData(msg.payload.body.data)
        : null);

      const unread = msg.labelIds?.includes("UNREAD") ?? false;
      await db
        .insert(emailHubInboxMessages)
        .values({
          threadId,
          mailboxAccountId,
          provider: "gmail",
          providerMessageId: msg.id,
          rfcMessageId: mid,
          fromEmail: fromParsed?.email ?? null,
          fromName: fromParsed?.name ?? null,
          toJson: parseEmailList(toH),
          subject: subj,
          snippet: msg.snippet ?? "",
          htmlBody: clampHtml(html),
          internalDate,
          isRead: !unread,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [emailHubInboxMessages.mailboxAccountId, emailHubInboxMessages.providerMessageId],
          set: {
            threadId,
            rfcMessageId: mid,
            fromEmail: fromParsed?.email ?? null,
            fromName: fromParsed?.name ?? null,
            toJson: parseEmailList(toH),
            subject: subj,
            snippet: msg.snippet ?? "",
            htmlBody: clampHtml(html),
            internalDate,
            isRead: !unread,
            updatedAt: new Date(),
          },
        });
    }
  }
}

type GraphMessage = {
  id: string;
  conversationId: string;
  subject?: string;
  bodyPreview?: string;
  receivedDateTime: string;
  isRead?: boolean;
  internetMessageId?: string;
  body?: { contentType?: string; content?: string };
  from?: { emailAddress?: { name?: string; address?: string } };
  toRecipients?: Array<{ emailAddress?: { name?: string; address?: string } }>;
};

async function graphApi<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Graph ${path}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function syncMicrosoftInbox(mailboxAccountId: number, accessToken: string): Promise<void> {
  const select = [
    "id",
    "conversationId",
    "subject",
    "bodyPreview",
    "receivedDateTime",
    "isRead",
    "internetMessageId",
    "body",
    "from",
    "toRecipients",
  ].join(",");
  const path = `/me/mailFolders/inbox/messages?$top=${MAX_THREADS}&$orderby=receivedDateTime desc&$select=${select}`;
  const page = await graphApi<{ value?: GraphMessage[] }>(accessToken, path);
  const messages = page.value || [];

  const byConv = new Map<string, GraphMessage[]>();
  for (const m of messages) {
    const cid = m.conversationId || m.id;
    const arr = byConv.get(cid) || [];
    arr.push(m);
    byConv.set(cid, arr);
  }

  for (const [, convMessages] of byConv) {
    convMessages.sort((a, b) => new Date(a.receivedDateTime).getTime() - new Date(b.receivedDateTime).getTime());
    const latest = convMessages[convMessages.length - 1];
    if (!latest) continue;
    const convId = latest.conversationId;
    const participants = new Set<string>();
    for (const m of convMessages) {
      const fe = m.from?.emailAddress?.address?.toLowerCase();
      if (fe) participants.add(fe);
      for (const r of m.toRecipients || []) {
        const e = r.emailAddress?.address?.toLowerCase();
        if (e) participants.add(e);
      }
    }
    const lastAt = new Date(latest.receivedDateTime);
    const anyUnread = convMessages.some((m) => m.isRead === false);
    const subj = latest.subject || "(no subject)";

    const [threadRow] = await db
      .insert(emailHubInboxThreads)
      .values({
        mailboxAccountId,
        provider: "microsoft",
        providerThreadId: convId,
        subject: subj,
        snippet: latest.bodyPreview ?? "",
        lastMessageAt: lastAt,
        isRead: !anyUnread,
        participantEmailsJson: [...participants],
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [emailHubInboxThreads.mailboxAccountId, emailHubInboxThreads.providerThreadId],
        set: {
          subject: subj,
          snippet: latest.bodyPreview ?? "",
          lastMessageAt: lastAt,
          isRead: !anyUnread,
          participantEmailsJson: [...participants],
          updatedAt: new Date(),
        },
      })
      .returning({ id: emailHubInboxThreads.id });

    const threadId = threadRow?.id;
    if (threadId == null) continue;

    for (const m of convMessages) {
      const fe = m.from?.emailAddress;
      const to = (m.toRecipients || [])
        .map((r) => ({
          email: (r.emailAddress?.address || "").toLowerCase(),
          name: r.emailAddress?.name || undefined,
        }))
        .filter((x) => x.email);
      const html =
        m.body?.contentType?.toLowerCase() === "html" && m.body.content ? m.body.content : null;
      const internalDate = new Date(m.receivedDateTime);
      await db
        .insert(emailHubInboxMessages)
        .values({
          threadId,
          mailboxAccountId,
          provider: "microsoft",
          providerMessageId: m.id,
          rfcMessageId: m.internetMessageId ?? null,
          fromEmail: fe?.address?.toLowerCase() ?? null,
          fromName: fe?.name ?? null,
          toJson: to,
          subject: m.subject || subj,
          snippet: m.bodyPreview ?? "",
          htmlBody: clampHtml(html),
          internalDate,
          isRead: m.isRead !== false,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [emailHubInboxMessages.mailboxAccountId, emailHubInboxMessages.providerMessageId],
          set: {
            threadId,
            rfcMessageId: m.internetMessageId ?? null,
            fromEmail: fe?.address?.toLowerCase() ?? null,
            fromName: fe?.name ?? null,
            toJson: to,
            subject: m.subject || subj,
            snippet: m.bodyPreview ?? "",
            htmlBody: clampHtml(html),
            internalDate,
            isRead: m.isRead !== false,
            updatedAt: new Date(),
          },
        });
    }
  }
}

export async function syncEmailHubMailboxAccount(mailboxAccountId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const account = await getMailboxAccountById(mailboxAccountId);
  if (!account?.enabled) return { ok: false, error: "Mailbox not found or disabled" };
  try {
    const { accessToken } = await getMailboxAccessToken(account);
    if (account.provider === "gmail") {
      await syncGmailInbox(mailboxAccountId, accessToken);
    } else if (account.provider === "microsoft") {
      await syncMicrosoftInbox(mailboxAccountId, accessToken);
    } else {
      return { ok: false, error: `Unknown provider ${account.provider}` };
    }
    await db
      .update(emailHubMailboxAccounts)
      .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(emailHubMailboxAccounts.id, mailboxAccountId));
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function syncAllEnabledMailboxes(): Promise<{ accounts: number; errors: string[] }> {
  const rows = await db.select().from(emailHubMailboxAccounts).where(eq(emailHubMailboxAccounts.enabled, true));
  const errors: string[] = [];
  for (const row of rows) {
    const r = await syncEmailHubMailboxAccount(row.id);
    if (!r.ok) errors.push(`#${row.id} (${row.provider}): ${r.error}`);
  }
  return { accounts: rows.length, errors };
}
