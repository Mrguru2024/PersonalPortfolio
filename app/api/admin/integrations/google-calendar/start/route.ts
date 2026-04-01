import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { getOAuthBaseUrlFromRequest, getOAuthStateCookieOptions } from "@/lib/siteUrl";
import { tryCreateSignedOAuthStateWithSubject } from "@server/lib/oauthSignedState";
import {
  buildGoogleCalendarAuthorizeUrl,
  getGoogleCalendarRedirectUri,
  GOOGLE_CALENDAR_OAUTH_STATE_COOKIE,
  isGoogleCalendarOAuthConfigured,
} from "@server/services/googleCalendarSchedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }
  const user = await getSessionUser(req);
  const userId = user?.id != null ? Number(user.id) : NaN;
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ message: "Could not resolve your user id. Sign in again." }, { status: 401 });
  }
  if (!isGoogleCalendarOAuthConfigured()) {
    return NextResponse.json(
      { message: "Add your Google Calendar app ID and secret in the site settings first." },
      { status: 400 },
    );
  }
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getGoogleCalendarRedirectUri(baseUrl);
  const state = tryCreateSignedOAuthStateWithSubject(String(userId), "google_calendar");
  if (!state) {
    return NextResponse.json(
      {
        message:
          "OAuth signing is not configured. Set SESSION_SECRET, OAUTH_STATE_SECRET, or GOOGLE_CALENDAR_OAUTH_STATE_SECRET.",
      },
      { status: 500 },
    );
  }
  const url = buildGoogleCalendarAuthorizeUrl(state, redirectUri);
  const res = NextResponse.redirect(url);
  const cookieOpts = getOAuthStateCookieOptions(req);
  res.cookies.set(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE, state, {
    ...cookieOpts,
    maxAge: 30 * 60,
  });
  return res;
}
