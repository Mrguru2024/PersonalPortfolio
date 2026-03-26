import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isSuperUser } from "@/lib/auth-helpers";
import { getOAuthBaseUrlFromRequest } from "@/lib/siteUrl";
import {
  buildFacebookAuthorizeUrl,
  getFacebookOAuthRedirectUri,
  isFacebookAppConfiguredForOAuth,
} from "@server/services/contentStudioFacebookConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "fb_cs_oauth_state";

export async function GET(req: NextRequest) {
  if (!(await isSuperUser(req))) {
    return NextResponse.json({ message: "Super user access required" }, { status: 403 });
  }
  if (!isFacebookAppConfiguredForOAuth()) {
    return NextResponse.json(
      {
        message:
          "Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET, add this callback URL to Valid OAuth Redirect URIs in the Meta app, then try again.",
      },
      { status: 400 },
    );
  }
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getFacebookOAuthRedirectUri(baseUrl);
  const state = randomBytes(24).toString("hex");
  const url = buildFacebookAuthorizeUrl(state, redirectUri);
  const res = NextResponse.redirect(url);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return res;
}
