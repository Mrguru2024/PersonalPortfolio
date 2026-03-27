import { NextRequest, NextResponse } from "next/server";
import { getOAuthBaseUrlFromRequest } from "@/lib/siteUrl";
import { getXOAuthRedirectUri, saveXTokensFromOAuthCode } from "@server/services/contentStudioXConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "x_cs_oauth_state";
const PKCE_COOKIE = "x_cs_oauth_pkce";

function redirectWithClear(baseUrl: string, query: string): NextResponse {
  const res = NextResponse.redirect(`${baseUrl}/admin/integrations${query}`);
  res.cookies.delete(STATE_COOKIE);
  res.cookies.delete(PKCE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getXOAuthRedirectUri(baseUrl);
  const { searchParams } = new URL(req.url);
  const err = searchParams.get("error");
  if (err) {
    return redirectWithClear(baseUrl, `?social_error=${encodeURIComponent(`X: ${err}`)}`);
  }
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = req.cookies.get(STATE_COOKIE)?.value;
  const verifier = req.cookies.get(PKCE_COOKIE)?.value;
  if (!code || !state || !cookieState || state !== cookieState || !verifier) {
    return redirectWithClear(baseUrl, "?social_error=x_invalid_state");
  }
  const saved = await saveXTokensFromOAuthCode(code, redirectUri, verifier);
  if (!saved.ok) {
    return redirectWithClear(baseUrl, `?social_error=${encodeURIComponent(`X: ${saved.error}`)}`);
  }
  return redirectWithClear(baseUrl, "?social=x_connected");
}
