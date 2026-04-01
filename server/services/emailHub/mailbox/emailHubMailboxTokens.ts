import { decryptSchedulingSecret } from "@server/lib/schedulingSecrets";
import type { EmailHubMailboxAccount } from "@shared/emailHubSchema";
import { getGmailMailboxOAuthClient, getMicrosoftMailboxOAuthClient } from "./emailHubMailboxConfig";

export type MailboxAccessToken = {
  accessToken: string;
  expiresAtMs: number;
};

export async function exchangeGmailCodeForTokens(code: string, redirectUri: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}> {
  const { clientId, clientSecret } = getGmailMailboxOAuthClient();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const j = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    accessToken: j.access_token,
    refreshToken: j.refresh_token ?? null,
    expiresIn: j.expires_in,
  };
}

export async function exchangeMicrosoftCodeForTokens(code: string, redirectUri: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}> {
  const { clientId, clientSecret } = getMicrosoftMailboxOAuthClient();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const j = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    accessToken: j.access_token,
    refreshToken: j.refresh_token ?? null,
    expiresIn: j.expires_in,
  };
}

async function refreshGmailAccess(refreshTokenPlain: string): Promise<MailboxAccessToken> {
  const { clientId, clientSecret } = getGmailMailboxOAuthClient();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshTokenPlain,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const j = (await res.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: j.access_token,
    expiresAtMs: Date.now() + Math.max(30, j.expires_in - 60) * 1000,
  };
}

async function refreshMicrosoftAccess(refreshTokenPlain: string): Promise<MailboxAccessToken> {
  const { clientId, clientSecret } = getMicrosoftMailboxOAuthClient();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshTokenPlain,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const j = (await res.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: j.access_token,
    expiresAtMs: Date.now() + Math.max(30, j.expires_in - 60) * 1000,
  };
}

export async function getMailboxAccessToken(account: EmailHubMailboxAccount): Promise<MailboxAccessToken> {
  const refreshPlain = decryptSchedulingSecret(account.encryptedRefreshToken);
  if (account.provider === "gmail") {
    return refreshGmailAccess(refreshPlain);
  }
  if (account.provider === "microsoft") {
    return refreshMicrosoftAccess(refreshPlain);
  }
  throw new Error(`Unknown mailbox provider: ${account.provider}`);
}
