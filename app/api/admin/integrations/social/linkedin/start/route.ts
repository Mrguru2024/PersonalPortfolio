import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getOAuthBaseUrlFromRequest } from "@/lib/siteUrl";
import { tryCreateSignedOAuthState } from "@server/lib/oauthSignedState";
import {
  buildLinkedInAuthorizeUrl,
  getLinkedInOAuthRedirectUri,
  isLinkedInOAuthAppConfigured,
} from "@server/services/contentStudioLinkedInConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }
  if (!isLinkedInOAuthAppConfigured()) {
    return NextResponse.json(
      {
        message:
          "Add your LinkedIn app ID and secret in the site settings, then paste the return link from Integrations into your LinkedIn app settings.",
      },
      { status: 400 },
    );
  }
  const baseUrl = getOAuthBaseUrlFromRequest(req);
  const redirectUri = getLinkedInOAuthRedirectUri(baseUrl);
  const state = tryCreateSignedOAuthState();
  if (!state) {
    return NextResponse.json(
      { message: "OAuth signing is not configured. Set SESSION_SECRET or OAUTH_STATE_SECRET." },
      { status: 500 },
    );
  }
  const url = buildLinkedInAuthorizeUrl(state, redirectUri);
  return NextResponse.redirect(url);
}
