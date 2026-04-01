/**
 * Future-facing communications abstraction (Phase 4).
 * Phase 1: UI uses tel:/mailto: + logging only — no vendor SDKs.
 */

export type CommunicationActionKind =
  | "call"
  | "email"
  | "sms"
  | "meeting"
  | "copy_phone"
  | "copy_email";

export interface CommunicationProviderContext {
  contactId: number;
  phone?: string | null;
  email?: string | null;
  meetingUrl?: string | null;
}

export interface CommunicationProvider {
  readonly key: string;
  supports(action: CommunicationActionKind): boolean;
  /** Build dial/mail URLs or deep links — return null if not applicable */
  resolveLink(action: CommunicationActionKind, ctx: CommunicationProviderContext): string | null;
}
