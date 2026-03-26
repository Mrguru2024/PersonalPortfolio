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
    return NextResponse.json({ message: "Super user access required" }, { status: 403 });
  }
  if (!isXOAuthAppConfigured()) {
    return NextResponse.json(
      {
        message:
          "Set X_CLIENT_ID and X_CLIENT_SECRET (OAuth 2.0). Add type Web App callback URL in X Developer Portal.",
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
