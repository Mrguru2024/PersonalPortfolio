import { NextRequest, NextResponse } from "next/server";
import { getOAuthBaseUrlFromRequest } from "@/lib/siteUrl";
import {
  getLinkedInOAuthRedirectUri,
  saveLinkedInTokensFromOAuthCode,
} from "@server/services/contentStudioLinkedInConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "li_cs_oauth_state";

function redirectWithClear(baseUrl: string, query: string): NextResponse {
  const res = NextResponse.redirect(`${baseUrl}/admin/integrations${query}`);
  res.cookies.delete(STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getLinkedInOAuthRedirectUri(baseUrl);
  const { searchParams } = new URL(req.url);
  const err = searchParams.get("error");
  if (err) return redirectWithClear(baseUrl, `?social_error=${encodeURIComponent(`LinkedIn: ${err}`)}`);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = req.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectWithClear(baseUrl, "?social_error=linkedin_invalid_state");
  }
  const saved = await saveLinkedInTokensFromOAuthCode(code, redirectUri);
  if (!saved.ok) {
    return redirectWithClear(baseUrl, `?social_error=${encodeURIComponent(`LinkedIn: ${saved.error}`)}`);
  }
  return redirectWithClear(baseUrl, "?social=linkedin_connected");
}
