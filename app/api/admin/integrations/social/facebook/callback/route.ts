import { NextRequest, NextResponse } from "next/server";
import { getOAuthBaseUrlFromRequest, getOAuthStateCookieOptions, expireOAuthStateCookie } from "@/lib/siteUrl";
import {
  completeFacebookContentStudioOAuth,
  FB_CS_PAGE_PICK_COOKIE,
  getFacebookOAuthRedirectUri,
  serializeFacebookPagePickCookie,
} from "@server/services/contentStudioFacebookConnectService";
import { verifySignedOAuthState } from "@server/lib/oauthSignedState";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "fb_cs_oauth_state";

function redirectWithCookieClear(req: NextRequest, baseUrl: string, query: string): NextResponse {
  const res = NextResponse.redirect(`${baseUrl}/admin/integrations${query}`);
  expireOAuthStateCookie(res, req, STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getFacebookOAuthRedirectUri(baseUrl);

  const { searchParams } = new URL(req.url);
  const err = searchParams.get("error");
  if (err) {
    return redirectWithCookieClear(req, baseUrl, `?social_error=${encodeURIComponent(err)}`);
  }
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state || !verifySignedOAuthState(state, "meta")) {
    return redirectWithCookieClear(req, baseUrl, "?social_error=invalid_state");
  }

  const outcome = await completeFacebookContentStudioOAuth(code, redirectUri);
  if (outcome.kind === "error") {
    return redirectWithCookieClear(req, baseUrl, `?social_error=${encodeURIComponent(outcome.error)}`);
  }
  if (outcome.kind === "saved") {
    return redirectWithCookieClear(req, baseUrl, "?social=facebook_connected");
  }
  const enc = serializeFacebookPagePickCookie(outcome.candidates);
  const res = NextResponse.redirect(`${baseUrl}/admin/integrations?facebook_pick=1`);
  expireOAuthStateCookie(res, req, STATE_COOKIE);
  res.cookies.set(FB_CS_PAGE_PICK_COOKIE, enc, getOAuthStateCookieOptions(req));
  return res;
}
