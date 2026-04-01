import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getOAuthBaseUrlFromRequest } from "@/lib/siteUrl";
import { tryCreateSignedOAuthState } from "@server/lib/oauthSignedState";
import {
  buildFacebookAuthorizeUrl,
  getFacebookOAuthRedirectUri,
  isFacebookAppConfiguredForOAuth,
} from "@server/services/contentStudioFacebookConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }
  if (!isFacebookAppConfiguredForOAuth()) {
    return NextResponse.json(
      {
        message:
          "Add your Meta app ID and secret in the site settings, then in Meta paste the return link from Integrations (yellow box) exactly as shown and try again.",
      },
      { status: 400 },
    );
  }
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getFacebookOAuthRedirectUri(baseUrl);
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
  const url = buildFacebookAuthorizeUrl(state, redirectUri);
  return NextResponse.redirect(url);
}
