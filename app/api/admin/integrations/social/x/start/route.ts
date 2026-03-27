import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isSuperUser } from "@/lib/auth-helpers";
import { getOAuthBaseUrlFromRequest } from "@/lib/siteUrl";
import {
  buildXAuthorizeUrl,
  generateXOAuthPkce,
  getXOAuthRedirectUri,
  isXOAuthAppConfigured,
} from "@server/services/contentStudioXConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "x_cs_oauth_state";
const PKCE_COOKIE = "x_cs_oauth_pkce";

export async function GET(req: NextRequest) {
  if (!(await isSuperUser(req))) {
    return NextResponse.json({ message: "Sign in with the site owner account to connect accounts." }, { status: 403 });
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
  const state = randomBytes(24).toString("hex");
  const { verifier, challenge } = generateXOAuthPkce();
  const url = buildXAuthorizeUrl(state, redirectUri, challenge);
  const res = NextResponse.redirect(url);
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  };
  res.cookies.set(STATE_COOKIE, state, cookieOpts);
  res.cookies.set(PKCE_COOKIE, verifier, cookieOpts);
  return res;
}
