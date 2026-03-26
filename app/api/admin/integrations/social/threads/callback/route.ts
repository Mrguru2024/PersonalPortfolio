import { NextRequest, NextResponse } from "next/server";
import { getOAuthBaseUrlFromRequest } from "@/lib/siteUrl";
import {
  getThreadsOAuthRedirectUri,
  saveThreadsTokensFromOAuthCode,
} from "@server/services/contentStudioThreadsConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "th_cs_oauth_state";

function redirectWithClear(baseUrl: string, query: string): NextResponse {
  const res = NextResponse.redirect(`${baseUrl}/admin/integrations${query}`);
  res.cookies.delete(STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getThreadsOAuthRedirectUri(baseUrl);
  const { searchParams } = new URL(req.url);
  const err = searchParams.get("error");
  if (err) {
    return redirectWithClear(baseUrl, `?social_error=${encodeURIComponent(`Threads: ${err}`)}`);
  }
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = req.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectWithClear(baseUrl, "?social_error=threads_invalid_state");
  }
  const saved = await saveThreadsTokensFromOAuthCode(code, redirectUri);
  if (!saved.ok) {
    return redirectWithClear(baseUrl, `?social_error=${encodeURIComponent(`Threads: ${saved.error}`)}`);
  }
  return redirectWithClear(baseUrl, "?social=threads_connected");
}
