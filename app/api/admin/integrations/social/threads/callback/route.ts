import { NextRequest, NextResponse } from "next/server";
import { getOAuthBaseUrlFromRequest, expireOAuthStateCookie } from "@/lib/siteUrl";
import {
  getThreadsOAuthRedirectUri,
  saveThreadsTokensFromOAuthCode,
} from "@server/services/contentStudioThreadsConnectService";
import { verifySignedOAuthState } from "@server/lib/oauthSignedState";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "th_cs_oauth_state";

function redirectWithClear(req: NextRequest, baseUrl: string, query: string): NextResponse {
  const res = NextResponse.redirect(`${baseUrl}/admin/integrations${query}`);
  expireOAuthStateCookie(res, req, STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getThreadsOAuthRedirectUri(baseUrl);
  const { searchParams } = new URL(req.url);
  const err = searchParams.get("error");
  if (err) {
    return redirectWithClear(req, baseUrl, `?social_error=${encodeURIComponent(`Threads: ${err}`)}`);
  }
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state || !verifySignedOAuthState(state, "meta")) {
    return redirectWithClear(req, baseUrl, "?social_error=threads_invalid_state");
  }
  const saved = await saveThreadsTokensFromOAuthCode(code, redirectUri);
  if (!saved.ok) {
    return redirectWithClear(req, baseUrl, `?social_error=${encodeURIComponent(`Threads: ${saved.error}`)}`);
  }
  return redirectWithClear(req, baseUrl, "?social=threads_connected");
}
