import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { getOAuthBaseUrlFromRequest, expireOAuthStateCookie } from "@/lib/siteUrl";
import {
  getGoogleCalendarRedirectUri,
  GOOGLE_CALENDAR_OAUTH_STATE_COOKIE,
  saveGoogleCalendarTokensFromCode,
} from "@server/services/googleCalendarSchedulingService";
import { verifyGoogleCalendarOAuthState } from "@server/lib/oauthSignedState";

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
    const desc = searchParams.get("error_description")?.trim() ?? "";
    const qs = new URLSearchParams();
    qs.set("gcal_error", err);
    if (desc) qs.set("gcal_error_detail", desc.slice(0, 600));
    return redirectWithCookieClear(req, baseUrl, `?${qs.toString()}`);
  }
  const code = searchParams.get("code");
  const stateQ = searchParams.get("state")?.trim() ?? null;
  const stateCookie = req.cookies.get(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE)?.value ?? null;

  const verified = verifyGoogleCalendarOAuthState(stateQ, stateCookie);
  if (!code || !verified.ok) {
    return redirectWithCookieClear(req, baseUrl, "?gcal_error=invalid_state");
  }

  const userId = Number(verified.subject);
  if (!Number.isFinite(userId) || userId <= 0) {
    return redirectWithCookieClear(req, baseUrl, "?gcal_error=invalid_state");
  }

  if (!(await isAdmin(req))) {
    return redirectWithCookieClear(req, baseUrl, "?gcal_error=admin_required");
  }
  const sessionUser = await getSessionUser(req);
  const sessionId = sessionUser?.id != null ? Number(sessionUser.id) : NaN;
  if (!Number.isFinite(sessionId) || sessionId !== userId) {
    return redirectWithCookieClear(req, baseUrl, "?gcal_error=session_mismatch");
  }

  const saved = await saveGoogleCalendarTokensFromCode(code, redirectUri, userId);
  if (!saved.ok) {
    return redirectWithCookieClear(req, baseUrl, `?gcal_error=${encodeURIComponent(saved.error)}`);
  }
  return redirectWithCookieClear(req, baseUrl, "?gcal=connected");
}
