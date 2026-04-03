import type Imap from "imap";
import type { ParsedMail } from "mailparser";
import type { Stream } from "node:stream";
import { getIonosCredentials, getIonosImapConfig, isIonosMailboxConfigured } from "./ionosEnv";
import type { SystemEmailAttachmentMeta, SystemEmailMessage } from "@shared/systemEmailTypes";

function previewFromParsed(parsed: ParsedMail, max = 220): string {
  const t = parsed.text?.trim();
  if (t) return t.replace(/\s+/g, " ").slice(0, max);
  const rawHtml = typeof parsed.html === "string" ? parsed.html : "";
  const h = rawHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return h.slice(0, max);
}

function firstReferenceId(refs: ParsedMail["references"]): string | null {
  if (!refs) return null;
  if (typeof refs === "string") return refs;
  if (Array.isArray(refs) && refs[0]) return refs[0];
  return null;
}

function threadKeyFromParsed(parsed: ParsedMail): string | null {
  const fromReply = parsed.inReplyTo?.replace(/[<>]/g, "").trim();
  if (fromReply) return fromReply;
  const ref = firstReferenceId(parsed.references)?.replace(/[<>]/g, "").trim();
  if (ref) return ref;
  const mid = parsed.messageId?.replace(/[<>]/g, "").trim();
  if (mid) return mid;
  const sub = parsed.subject?.replace(/^(re|fwd):\s*/i, "").trim();
  return sub || null;
}

function listAddresses(field: ParsedMail["to"]): string[] {
  if (!field) return [];
  const objs = Array.isArray(field) ? field : [field];
  const out: string[] = [];
  for (const obj of objs) {
    for (const v of obj.value) {
      if (v.address) out.push(v.address);
    }
  }
  return out;
}

function primaryFrom(parsed: ParsedMail): { display: string; address: string } {
  const f = parsed.from;
  if (!f) return { display: "Unknown", address: "" };
  if (typeof f === "string") return { display: f, address: extractEmail(f) };
  const v = f.value[0];
  const address = (v?.address || "").trim().toLowerCase();
  const display = (v?.name || address || "Unknown").trim();
  return { display, address };
}

function extractEmail(raw: string): string {
  const m = raw.match(/<([^>]+)>/);
  return (m?.[1] || raw).trim().toLowerCase();
}

function attachmentMeta(parsed: ParsedMail): SystemEmailAttachmentMeta[] {
  const list = parsed.attachments ?? [];
  return list.map((a) => ({
    filename: a.filename || "(attachment)",
    contentType: a.contentType || "application/octet-stream",
    size: a.size ?? (a.content?.length ?? 0),
  }));
}

function normalizeParsed(
  parsed: ParsedMail,
  uid: number,
  isUnread: boolean,
): SystemEmailMessage {
  const from = primaryFrom(parsed);
  return {
    uid,
    messageId: parsed.messageId?.replace(/[<>]/g, "") ?? null,
    from: from.display,
    fromAddress: from.address,
    to: listAddresses(parsed.to),
    subject: (parsed.subject || "(no subject)").trim(),
    date: (parsed.date ?? new Date()).toISOString(),
    preview: previewFromParsed(parsed),
    text: parsed.text ?? null,
    html: typeof parsed.html === "string" ? parsed.html : null,
    isUnread,
    threadKey: threadKeyFromParsed(parsed),
    replyTo: parsed.replyTo?.value?.[0]?.address ?? null,
    attachments: attachmentMeta(parsed),
    crmMatches: [],
  };
}

function parseMessage(msg: Imap.ImapMessage, simpleParser: typeof import("mailparser").simpleParser): Promise<SystemEmailMessage | null> {
  return new Promise((resolve) => {
    let uid = 0;
    let isUnread = true;
    let settled = false;
    let gotBody = false;

    const finish = (value: SystemEmailMessage | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    msg.once("attributes", (a: Imap.ImapMessageAttributes) => {
      uid = a.uid;
      const flags = a.flags || [];
      isUnread = flags.indexOf("\\Seen") < 0;
    });

    msg.on("body", (stream) => {
      gotBody = true;
      simpleParser(stream as unknown as Stream)
        .then((parsed) => finish(normalizeParsed(parsed, uid, isUnread)))
        .catch((e) => {
          console.error("[ionosImap] mailparser error:", e);
          finish(null);
        });
    });

    msg.once("end", () => {
      if (!gotBody) finish(null);
    });
  });
}

async function withImapConnection<T>(fn: (imap: Imap) => Promise<T>): Promise<T> {
  const ImapCtor = (await import("imap")).default;
  const { email, password } = getIonosCredentials();
  const { host, port } = getIonosImapConfig();
  if (!email || !password) {
    throw new Error("IONOS credentials missing.");
  }

  const imap = new ImapCtor({
    user: email,
    password,
    host,
    port,
    tls: true,
    tlsOptions: { rejectUnauthorized: true },
  });

  await new Promise<void>((resolve, reject) => {
    imap.once("ready", () => resolve());
    imap.once("error", reject);
    imap.connect();
  });

  try {
    return await fn(imap);
  } finally {
    try {
      imap.end();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Fetch the newest messages from INBOX (read-only). Parses RFC822 with mailparser.
 */
export async function fetchRecentIonosInboxMessages(options: { limit?: number } = {}): Promise<
  { ok: true; messages: SystemEmailMessage[] } | { ok: false; error: string }
> {
  if (!isIonosMailboxConfigured()) {
    return { ok: false, error: "IONOS mailbox is not configured." };
  }

  const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);
  const { simpleParser } = await import("mailparser");

  try {
    const messages = await withImapConnection((imap) => {
      return new Promise<SystemEmailMessage[]>((resolve, reject) => {
        imap.openBox("INBOX", true, (err, box) => {
          if (err) {
            reject(err);
            return;
          }
          const total = box.messages.total;
          if (!total) {
            resolve([]);
            return;
          }
          const start = Math.max(1, total - limit + 1);
          const range = `${start}:${total}`;
          const f = imap.seq.fetch(range, { bodies: "", struct: true });
          const pending: Promise<SystemEmailMessage | null>[] = [];

          f.on("message", (msg) => {
            pending.push(parseMessage(msg, simpleParser));
          });

          f.once("error", reject);
          f.once("end", () => {
            void Promise.all(pending)
              .then((rows) => {
                const ok = rows.filter((r): r is SystemEmailMessage => r != null);
                ok.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                resolve(ok);
              })
              .catch(reject);
          });
        });
      });
    });

    return { ok: true, messages };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "IMAP connection failed";
    console.error("[ionosImap]", msg);
    return { ok: false, error: msg };
  }
}
