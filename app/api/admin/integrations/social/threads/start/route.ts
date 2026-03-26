import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isSuperUser } from "@/lib/auth-helpers";
import { getOAuthBaseUrlFromRequest } from "@/lib/siteUrl";
import {
  buildThreadsAuthorizeUrl,
  getThreadsOAuthRedirectUri,
  isThreadsOAuthConfigured,
} from "@server/services/contentStudioThreadsConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "th_cs_oauth_state";

export async function GET(req: NextRequest) {
  if (!(await isSuperUser(req))) {
    return NextResponse.json({ message: "Super user access required" }, { status: 403 });
  }
  if (!isThreadsOAuthConfigured()) {
    return NextResponse.json(
      {
        message:
          "Set THREADS_APP_ID + THREADS_APP_SECRET (or use FACEBOOK_APP_ID + FACEBOOK_APP_SECRET). Add Threads callback to Valid OAuth Redirect URIs and enable threads_basic / threads_content_publish.",
      },
      { status: 400 },
    );
  }
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getThreadsOAuthRedirectUri(baseUrl);
  const state = randomBytes(24).toString("hex");
  const url = buildThreadsAuthorizeUrl(state, redirectUri);
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
