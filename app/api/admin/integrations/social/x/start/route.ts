import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getOAuthBaseUrlFromRequest, getOAuthStateCookieOptions } from "@/lib/siteUrl";
import { tryCreateSignedOAuthState } from "@server/lib/oauthSignedState";
import {
  buildXAuthorizeUrl,
  generateXOAuthPkce,
  getXOAuthRedirectUri,
  isXOAuthAppConfigured,
} from "@server/services/contentStudioXConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PKCE_COOKIE = "x_cs_oauth_pkce";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }
  if (!isXOAuthAppConfigured()) {
    return NextResponse.json(
      {
        message:
          "Add your X app ID and secret in the site settings, then in X’s developer area add the return link from Integrations as the app’s callback URL.",
      },
      { status: 400 },
    );
  }
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getXOAuthRedirectUri(baseUrl);
  const state = tryCreateSignedOAuthState();
  if (!state) {
    return NextResponse.json(
      { message: "OAuth signing is not configured. Set SESSION_SECRET or OAUTH_STATE_SECRET." },
      { status: 500 },
    );
  }
  const { verifier, challenge } = generateXOAuthPkce();
  const url = buildXAuthorizeUrl(state, redirectUri, challenge);
  const res = NextResponse.redirect(url);
  const cookieOpts = getOAuthStateCookieOptions(req);
  res.cookies.set(PKCE_COOKIE, verifier, cookieOpts);
  return res;
}
