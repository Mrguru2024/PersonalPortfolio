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
    return NextResponse.json({ message: "Sign in with the site owner account to connect accounts." }, { status: 403 });
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
