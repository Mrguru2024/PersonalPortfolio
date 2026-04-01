/**
 * Email Hub — bounded storage for synced inbox + outbound payloads (Neon/Postgres).
 * Tune via env only when you need to raise caps for dedicated deployments.
 */

const num = (raw: string | undefined, fallback: number) => {
  const n = raw != null ? Number(String(raw).trim()) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

/** Max inbox threads fetched per provider sync (Gmail thread list / Microsoft batch). */
export const EMAIL_HUB_INBOX_SYNC_MAX_THREADS = num(
  process.env.EMAIL_HUB_INBOX_SYNC_MAX_THREADS,
  40,
);

/**
 * Stored HTML body cap per message (UTF-16 length ≈ chars). Keeps row size predictable (~256KB).
 */
export const EMAIL_HUB_INBOX_MAX_HTML_CHARS = num(process.env.EMAIL_HUB_INBOX_MAX_HTML_CHARS, 256 * 1024);

/** Default / max threads returned in admin inbox list API. */
export const EMAIL_HUB_INBOX_LIST_DEFAULT_LIMIT = 80;
export const EMAIL_HUB_INBOX_LIST_MAX_LIMIT = num(process.env.EMAIL_HUB_INBOX_LIST_MAX_LIMIT, 150);

/**
 * Auto-delete stored copies of non-archived inbox messages older than this many days.
 * Archived threads are never purged by retention.
 */
export const EMAIL_HUB_INBOX_RETENTION_DAYS = num(process.env.EMAIL_HUB_INBOX_RETENTION_DAYS, 90);

/** Soft guidance for UI (~bytes of html+snippet per mailbox, excluding indexes). */
export const EMAIL_HUB_INBOX_ESTIMATED_CAP_BYTES_PER_MAILBOX = num(
  process.env.EMAIL_HUB_INBOX_ESTIMATED_CAP_BYTES_PER_MAILBOX,
  120 * 1024 * 1024,
);

export function emailHubInboxLimitsForApi() {
  return {
    syncMaxThreads: EMAIL_HUB_INBOX_SYNC_MAX_THREADS,
    maxHtmlCharsPerMessage: EMAIL_HUB_INBOX_MAX_HTML_CHARS,
    listDefaultLimit: EMAIL_HUB_INBOX_LIST_DEFAULT_LIMIT,
    listMaxLimit: EMAIL_HUB_INBOX_LIST_MAX_LIMIT,
    retentionDaysNonArchived: EMAIL_HUB_INBOX_RETENTION_DAYS,
    estimatedCapBytesPerMailbox: EMAIL_HUB_INBOX_ESTIMATED_CAP_BYTES_PER_MAILBOX,
    archivedExemptFromRetention: true,
  };
}
