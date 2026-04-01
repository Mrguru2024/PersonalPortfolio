import { NextRequest, NextResponse } from "next/server";
import { getOAuthBaseUrlFromRequest, expireOAuthStateCookie } from "@/lib/siteUrl";
import {
  getLinkedInOAuthRedirectUri,
  saveLinkedInTokensFromOAuthCode,
} from "@server/services/contentStudioLinkedInConnectService";
import { verifySignedOAuthState } from "@server/lib/oauthSignedState";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "li_cs_oauth_state";

function redirectWithClear(req: NextRequest, baseUrl: string, query: string): NextResponse {
  const res = NextResponse.redirect(`${baseUrl}/admin/integrations${query}`);
  expireOAuthStateCookie(res, req, STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getLinkedInOAuthRedirectUri(baseUrl);
  const { searchParams } = new URL(req.url);
  const err = searchParams.get("error");
  if (err) return redirectWithClear(req, baseUrl, `?social_error=${encodeURIComponent(`LinkedIn: ${err}`)}`);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state || !verifySignedOAuthState(state)) {
    return redirectWithClear(req, baseUrl, "?social_error=linkedin_invalid_state");
  }
  const saved = await saveLinkedInTokensFromOAuthCode(code, redirectUri);
  if (!saved.ok) {
    return redirectWithClear(req, baseUrl, `?social_error=${encodeURIComponent(`LinkedIn: ${saved.error}`)}`);
  }
  const notice = "notice" in saved && saved.notice ? `&social_notice=${encodeURIComponent(saved.notice)}` : "";
  return redirectWithClear(req, baseUrl, `?social=linkedin_connected${notice}`);
}
