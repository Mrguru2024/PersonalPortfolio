/**
 * Pure sender resolution for IONOS outbound (no env reads here — inject config from server).
 */

export type PrimarySenderConfig = {
  name: string;
  email: string;
};

export type AuthorizedSenderUser = {
  id: number;
  full_name: string | null;
  email: string | null;
  isEmailAuthorized: boolean;
  senderName: string | null;
  senderEmail: string | null;
};

/** Normalize for comparisons */
export function normalizeEmail(e: string): string {
  return e.trim().toLowerCase();
}

export function emailHost(email: string): string {
  const i = email.lastIndexOf("@");
  if (i < 0) return "";
  return email.slice(i + 1).toLowerCase();
}

export function isAllowedOutboundDomain(email: string, allowedDomainLower: string): boolean {
  const host = emailHost(normalizeEmail(email));
  return host === allowedDomainLower.toLowerCase();
}

/**
 * Validate selected authorized row: flag on, domain, non-empty.
 */
export function senderRowIsSendable(
  row: AuthorizedSenderUser,
  allowedDomainLower: string,
): row is AuthorizedSenderUser & { senderEmail: string; senderName: string | null } {
  if (!row.isEmailAuthorized) return false;
  const se = row.senderEmail?.trim();
  if (!se || !isAllowedOutboundDomain(se, allowedDomainLower)) return false;
  return true;
}

export function displayNameForAuthorizedSender(row: AuthorizedSenderUser): string {
  const custom = row.senderName?.trim();
  if (custom) return custom;
  if (row.full_name?.trim()) return row.full_name.trim();
  return row.email?.trim() || `User ${row.id}`;
}

/**
 * Resolve From identity after server-side validation.
 * @param sendAsKey "primary" or "user:<id>"
 */
export function resolveFromForSendAs(
  sendAsKey: string,
  primary: PrimarySenderConfig,
  authorizedById: Map<number, AuthorizedSenderUser>,
  allowedDomainLower: string,
): PrimarySenderConfig {
  const trimmed = sendAsKey.trim();
  if (trimmed === "primary" || !trimmed) {
    return primary;
  }
  const m = /^user:(\d+)$/.exec(trimmed);
  if (!m) return primary;
  const id = Number(m[1]);
  if (!Number.isFinite(id)) return primary;
  const row = authorizedById.get(id);
  if (!row || !senderRowIsSendable(row, allowedDomainLower)) return primary;
  return {
    name: displayNameForAuthorizedSender(row),
    email: normalizeEmail(row.senderEmail!),
  };
}
