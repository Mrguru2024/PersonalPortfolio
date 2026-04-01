import { db } from "@server/db";
import { emailHubMailboxAccounts } from "@shared/emailHubSchema";
import { encryptSchedulingSecret, canEncryptSchedulingSecrets } from "@server/lib/schedulingSecrets";
import { exchangeGmailCodeForTokens, exchangeMicrosoftCodeForTokens } from "./emailHubMailboxTokens";

async function fetchGmailProfileEmail(accessToken: string): Promise<{ email: string }> {
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  const j = (await res.json()) as { emailAddress?: string };
  if (!j.emailAddress) throw new Error("Gmail profile missing emailAddress");
  return { email: j.emailAddress };
}

async function fetchMicrosoftProfile(
  accessToken: string,
): Promise<{ email: string; displayName: string | null }> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  const j = (await res.json()) as { displayName?: string; mail?: string; userPrincipalName?: string };
  const email = (j.mail || j.userPrincipalName || "").trim();
  if (!email) throw new Error("Microsoft Graph profile missing email");
  return { email, displayName: j.displayName ?? null };
}

export async function connectGmailMailboxFromCode(
  userId: number,
  code: string,
  redirectUri: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canEncryptSchedulingSecrets()) {
    return {
      ok: false,
      error: "Token encryption not configured (SCHEDULING_TOKEN_ENCRYPTION_KEY or SESSION_SECRET, 16+ chars).",
    };
  }
  try {
    const tokens = await exchangeGmailCodeForTokens(code, redirectUri);
    if (!tokens.refreshToken) {
      return {
        ok: false,
        error:
          "Google did not return a refresh token. Remove this app under Google Account → Security → Third-party access, then reconnect.",
      };
    }
    const profile = await fetchGmailProfileEmail(tokens.accessToken);
    const enc = encryptSchedulingSecret(tokens.refreshToken);
    await db
      .insert(emailHubMailboxAccounts)
      .values({
        userId,
        provider: "gmail",
        emailAddress: profile.email,
        displayName: null,
        encryptedRefreshToken: enc,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [emailHubMailboxAccounts.userId, emailHubMailboxAccounts.provider],
        set: {
          emailAddress: profile.email,
          encryptedRefreshToken: enc,
          enabled: true,
          updatedAt: new Date(),
        },
      });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function connectMicrosoftMailboxFromCode(
  userId: number,
  code: string,
  redirectUri: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canEncryptSchedulingSecrets()) {
    return {
      ok: false,
      error: "Token encryption not configured (SCHEDULING_TOKEN_ENCRYPTION_KEY or SESSION_SECRET, 16+ chars).",
    };
  }
  try {
    const tokens = await exchangeMicrosoftCodeForTokens(code, redirectUri);
    if (!tokens.refreshToken) {
      return {
        ok: false,
        error: "Microsoft did not return a refresh token. Ensure offline_access is granted and reconnect once.",
      };
    }
    const profile = await fetchMicrosoftProfile(tokens.accessToken);
    const enc = encryptSchedulingSecret(tokens.refreshToken);
    await db
      .insert(emailHubMailboxAccounts)
      .values({
        userId,
        provider: "microsoft",
        emailAddress: profile.email,
        displayName: profile.displayName,
        encryptedRefreshToken: enc,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [emailHubMailboxAccounts.userId, emailHubMailboxAccounts.provider],
        set: {
          emailAddress: profile.email,
          displayName: profile.displayName,
          encryptedRefreshToken: enc,
          enabled: true,
          updatedAt: new Date(),
        },
      });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
