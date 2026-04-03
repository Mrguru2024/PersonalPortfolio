/**
 * Normalized admin system-email (IONOS IMAP) payload for API + UI.
 * Kept in shared for typed client fetches; no secrets.
 */

export type SystemEmailAttachmentMeta = {
  filename: string;
  contentType: string;
  size: number;
};

export type SystemEmailCrmMatch = {
  id: number;
  name: string;
  email: string;
  type: string;
  status: string | null;
};

export type SystemEmailMessage = {
  uid: number;
  messageId: string | null;
  from: string;
  fromAddress: string;
  to: string[];
  subject: string;
  date: string;
  preview: string;
  text: string | null;
  /** Raw HTML from provider — render only inside a sandboxed iframe, never as trusted DOM. */
  html: string | null;
  isUnread: boolean;
  threadKey: string | null;
  replyTo: string | null;
  attachments: SystemEmailAttachmentMeta[];
  crmMatches: SystemEmailCrmMatch[];
};

export type SystemEmailStatus = {
  smtpConfigured: boolean;
  imapConfigured: boolean;
  senderEmail: string | null;
  senderName: string | null;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
};
