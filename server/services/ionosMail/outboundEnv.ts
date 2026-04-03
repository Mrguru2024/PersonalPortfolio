/**
 * Server-only IONOS / Ascendra outbound configuration (reads process.env).
 */

export function getOutboundAllowedDomain(): string {
  return (process.env.ASCENDRA_OUTBOUND_EMAIL_DOMAIN?.trim() || "ascendra.tech").toLowerCase();
}

export function getPrimaryMailboxEmail(): string {
  return (
    process.env.ASCENDRA_PRIMARY_FROM_EMAIL?.trim() ||
    process.env.IONOS_EMAIL?.trim() ||
    ""
  ).toLowerCase();
}

export function getPrimarySenderDisplayName(): string {
  return (
    process.env.ASCENDRA_PRIMARY_SENDER_NAME?.trim() ||
    process.env.IONOS_FROM_NAME?.trim() ||
    process.env.FROM_NAME?.trim() ||
    "Ascendra"
  );
}

export function getPrimarySenderConfig(): { name: string; email: string } {
  return {
    name: getPrimarySenderDisplayName(),
    email: getPrimaryMailboxEmail(),
  };
}

export function getDefaultReplyToFallbackEmail(): string {
  return (
    process.env.ASCENDRA_DEFAULT_REPLY_TO_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    getPrimaryMailboxEmail()
  ).toLowerCase();
}
