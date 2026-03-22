/**
 * Validates Google Ads–related OAuth credentials (refresh token flow).
 * Full campaign mutate via Google Ads API is version-sensitive; see Docs for SDK path.
 */

export type GoogleAdsConnectionResult =
  | { ok: true; accessTokenExpiresIn: number }
  | { ok: false; error: string };

export async function validateGoogleAdsOAuth(): Promise<GoogleAdsConnectionResult> {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    return {
      ok: false,
      error:
        "Missing GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, or GOOGLE_ADS_REFRESH_TOKEN (server-side only).",
    };
  }
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !data.access_token) {
    return {
      ok: false,
      error: data.error || `OAuth token refresh failed (${res.status}).`,
    };
  }
  return { ok: true, accessTokenExpiresIn: data.expires_in ?? 3600 };
}

export async function validateGoogleAdsDeveloperToken(): Promise<{ ok: boolean; message: string }> {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  if (!token) {
    return { ok: false, message: "GOOGLE_ADS_DEVELOPER_TOKEN not set (required for API calls)." };
  }
  return { ok: true, message: "Developer token present (approval status is verified on first API call)." };
}
