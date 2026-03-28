import { NextRequest, NextResponse } from "next/server";
import { getOAuthBaseUrlFromRequest, expireOAuthStateCookie } from "@/lib/siteUrl";
import { getXOAuthRedirectUri, saveXTokensFromOAuthCode } from "@server/services/contentStudioXConnectService";
import { verifySignedOAuthState } from "@server/lib/oauthSignedState";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PKCE_COOKIE = "x_cs_oauth_pkce";

function redirectWithClear(req: NextRequest, baseUrl: string, query: string): NextResponse {
  const res = NextResponse.redirect(`${baseUrl}/admin/integrations${query}`);
  expireOAuthStateCookie(res, req, PKCE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getXOAuthRedirectUri(baseUrl);
  const { searchParams } = new URL(req.url);
  const err = searchParams.get("error");
  if (err) {
    return redirectWithClear(req, baseUrl, `?social_error=${encodeURIComponent(`X: ${err}`)}`);
  }
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const verifier = req.cookies.get(PKCE_COOKIE)?.value;
  if (!code || !state || !verifier || !verifySignedOAuthState(state)) {
    return redirectWithClear(req, baseUrl, "?social_error=x_invalid_state");
  }
  const saved = await saveXTokensFromOAuthCode(code, redirectUri, verifier);
  if (!saved.ok) {
    return redirectWithClear(req, baseUrl, `?social_error=${encodeURIComponent(`X: ${saved.error}`)}`);
  }
  return redirectWithClear(req, baseUrl, "?social=x_connected");
}
