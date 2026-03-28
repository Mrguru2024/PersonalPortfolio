import { NextRequest, NextResponse } from "next/server";
import { getOAuthBaseUrlFromRequest, expireOAuthStateCookie } from "@/lib/siteUrl";
import {
  getGoogleCalendarRedirectUri,
  saveGoogleCalendarTokensFromCode,
} from "@server/services/googleCalendarSchedulingService";
import { verifySignedOAuthState } from "@server/lib/oauthSignedState";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "gcal_oauth_state";

function redirectWithCookieClear(req: NextRequest, baseUrl: string, query: string): NextResponse {
  const res = NextResponse.redirect(`${baseUrl}/admin/integrations${query}`);
  expireOAuthStateCookie(res, req, STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getGoogleCalendarRedirectUri(baseUrl);

  const { searchParams } = new URL(req.url);
  const err = searchParams.get("error");
  if (err) {
    return redirectWithCookieClear(req, baseUrl, `?gcal_error=${encodeURIComponent(err)}`);
  }
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state || !verifySignedOAuthState(state)) {
    return redirectWithCookieClear(req, baseUrl, "?gcal_error=invalid_state");
  }

  const saved = await saveGoogleCalendarTokensFromCode(code, redirectUri);
  if (!saved.ok) {
    return redirectWithCookieClear(req, baseUrl, `?gcal_error=${encodeURIComponent(saved.error)}`);
  }
  return redirectWithCookieClear(req, baseUrl, "?gcal=connected");
}
