import { ensureAbsoluteUrl } from "@/lib/siteUrl";

export type EmailHubMailboxProvider = "gmail" | "microsoft";

export const GMAIL_MAILBOX_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
].join(" ");

export const MICROSOFT_MAILBOX_SCOPES = ["offline_access", "Mail.ReadWrite", "Mail.Send", "User.Read"].join(" ");

export function getEmailHubAppBaseUrl(req: { headers: Headers }, fallbackHost?: string): string {
  const rawBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    req.headers.get("origin")?.replace(/\/$/, "") ||
    fallbackHost ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  return ensureAbsoluteUrl(rawBase || "http://localhost:3000");
}

export function mailboxOAuthRedirectUri(baseUrl: string, provider: EmailHubMailboxProvider): string {
  const path =
    provider === "gmail" ?
      "/api/admin/email-hub/mailbox/gmail/callback"
    : "/api/admin/email-hub/mailbox/microsoft/callback";
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export function getGmailMailboxOAuthClient(): { clientId: string; clientSecret: string; ok: boolean } {
  const clientId = process.env.EMAIL_HUB_GMAIL_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.EMAIL_HUB_GMAIL_CLIENT_SECRET?.trim() || "";
  return { clientId, clientSecret, ok: !!(clientId && clientSecret) };
}

export function getMicrosoftMailboxOAuthClient(): { clientId: string; clientSecret: string; ok: boolean } {
  const clientId = process.env.EMAIL_HUB_MICROSOFT_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.EMAIL_HUB_MICROSOFT_CLIENT_SECRET?.trim() || "";
  return { clientId, clientSecret, ok: !!(clientId && clientSecret) };
}

export function buildGmailMailboxAuthorizeUrl(state: string, redirectUri: string): string {
  const { clientId } = getGmailMailboxOAuthClient();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_MAILBOX_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function buildMicrosoftMailboxAuthorizeUrl(state: string, redirectUri: string): string {
  const { clientId } = getMicrosoftMailboxOAuthClient();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: MICROSOFT_MAILBOX_SCOPES,
    state,
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}
