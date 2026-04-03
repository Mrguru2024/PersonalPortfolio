/**
 * IONOS mailbox environment (Ascendra system email).
 * Credentials are server-only; never send to the client.
 */

import type { SystemEmailStatus } from "@shared/systemEmailTypes";

export function getIonosCredentials(): {
  email: string | undefined;
  password: string | undefined;
} {
  return {
    email: process.env.IONOS_EMAIL?.trim(),
    password: process.env.IONOS_PASSWORD?.trim(),
  };
}

export function getIonosImapConfig(): { host: string; port: number } {
  return {
    host: process.env.IONOS_IMAP_HOST?.trim() || "imap.ionos.com",
    port: Number(process.env.IONOS_IMAP_PORT?.trim() || "993") || 993,
  };
}

export function getIonosSmtpConfig(): { host: string; port: number } {
  return {
    host: process.env.IONOS_SMTP_HOST?.trim() || "smtp.ionos.com",
    port: Number(process.env.IONOS_SMTP_PORT?.trim() || "587") || 587,
  };
}

export function isIonosMailboxConfigured(): boolean {
  const { email, password } = getIonosCredentials();
  return Boolean(email && password);
}

/** Display / From header name — aligns with Brevo FROM_NAME when IONOS_FROM_NAME omitted. */
export function getIonosFromName(): string {
  return (
    process.env.IONOS_FROM_NAME?.trim() ||
    process.env.FROM_NAME?.trim() ||
    "Ascendra Technologies"
  );
}

export function getPublicIonosMailStatus(): SystemEmailStatus {
  const { email } = getIonosCredentials();
  const imap = getIonosImapConfig();
  const smtp = getIonosSmtpConfig();
  const configured = isIonosMailboxConfigured();
  return {
    smtpConfigured: configured,
    imapConfigured: configured,
    senderEmail: email ?? null,
    senderName: getIonosFromName(),
    imapHost: imap.host,
    imapPort: imap.port,
    smtpHost: smtp.host,
    smtpPort: smtp.port,
  };
}
