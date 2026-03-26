import { NextRequest, NextResponse } from "next/server";
import { getOAuthBaseUrlFromRequest } from "@/lib/siteUrl";
import {
  getFacebookOAuthRedirectUri,
  saveFacebookPageTokensFromOAuthCode,
} from "@server/services/contentStudioFacebookConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "fb_cs_oauth_state";

function redirectWithCookieClear(baseUrl: string, query: string): NextResponse {
  const res = NextResponse.redirect(`${baseUrl}/admin/integrations${query}`);
  res.cookies.delete(STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getFacebookOAuthRedirectUri(baseUrl);

  const { searchParams } = new URL(req.url);
  const err = searchParams.get("error");
  if (err) {
    return redirectWithCookieClear(baseUrl, `?social_error=${encodeURIComponent(err)}`);
  }
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = req.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectWithCookieClear(baseUrl, "?social_error=invalid_state");
  }

  const saved = await saveFacebookPageTokensFromOAuthCode(code, redirectUri);
  if (!saved.ok) {
    return redirectWithCookieClear(baseUrl, `?social_error=${encodeURIComponent(saved.error)}`);
  }
  return redirectWithCookieClear(baseUrl, "?social=facebook_connected");
}
