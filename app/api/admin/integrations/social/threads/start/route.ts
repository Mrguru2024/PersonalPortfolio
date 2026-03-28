import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getOAuthBaseUrlFromRequest } from "@/lib/siteUrl";
import { tryCreateSignedOAuthState } from "@server/lib/oauthSignedState";
import {
  buildThreadsAuthorizeUrl,
  getThreadsOAuthRedirectUri,
  isThreadsOAuthConfigured,
} from "@server/services/contentStudioThreadsConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }
  if (!isThreadsOAuthConfigured()) {
    return NextResponse.json(
      {
        message:
          "Add your Meta app details for Threads in the site settings (or reuse the same Meta app as Facebook), enable Threads posting there, and add the return links from Connections & email.",
      },
      { status: 400 },
    );
  }
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getThreadsOAuthRedirectUri(baseUrl);
  const state = tryCreateSignedOAuthState("meta");
  if (!state) {
    return NextResponse.json(
      {
        message:
          "OAuth signing is not configured. Set FACEBOOK_APP_SECRET, SESSION_SECRET, or OAUTH_STATE_SECRET.",
      },
      { status: 500 },
    );
  }
  const url = buildThreadsAuthorizeUrl(state, redirectUri);
  return NextResponse.redirect(url);
}
