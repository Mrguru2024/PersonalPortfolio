import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getOAuthBaseUrlFromRequest } from "@/lib/siteUrl";
import { tryCreateSignedOAuthState } from "@server/lib/oauthSignedState";
import {
  buildGoogleCalendarAuthorizeUrl,
  getGoogleCalendarRedirectUri,
  isGoogleCalendarOAuthConfigured,
} from "@server/services/googleCalendarSchedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }
  if (!isGoogleCalendarOAuthConfigured()) {
    return NextResponse.json(
      { message: "Add your Google Calendar app ID and secret in the site settings first." },
      { status: 400 },
    );
  }
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getGoogleCalendarRedirectUri(baseUrl);
  const state = tryCreateSignedOAuthState();
  if (!state) {
    return NextResponse.json(
      { message: "OAuth signing is not configured. Set SESSION_SECRET or OAUTH_STATE_SECRET." },
      { status: 500 },
    );
  }
  const url = buildGoogleCalendarAuthorizeUrl(state, redirectUri);
  return NextResponse.redirect(url);
}
