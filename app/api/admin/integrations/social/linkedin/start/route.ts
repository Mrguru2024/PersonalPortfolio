import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isSuperUser } from "@/lib/auth-helpers";
import { getOAuthBaseUrlFromRequest } from "@/lib/siteUrl";
import {
  buildLinkedInAuthorizeUrl,
  getLinkedInOAuthRedirectUri,
  isLinkedInOAuthAppConfigured,
} from "@server/services/contentStudioLinkedInConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "li_cs_oauth_state";

export async function GET(req: NextRequest) {
  if (!(await isSuperUser(req))) {
    return NextResponse.json({ message: "Super user access required" }, { status: 403 });
  }
  if (!isLinkedInOAuthAppConfigured()) {
    return NextResponse.json(
      { message: "Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET. Add the callback URL to your LinkedIn app redirect list." },
      { status: 400 },
    );
  }
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getLinkedInOAuthRedirectUri(baseUrl);
  const state = randomBytes(24).toString("hex");
  const url = buildLinkedInAuthorizeUrl(state, redirectUri);
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
