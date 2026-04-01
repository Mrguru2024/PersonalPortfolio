import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  buildGmailMailboxAuthorizeUrl,
  getEmailHubAppBaseUrl,
  getGmailMailboxOAuthClient,
  mailboxOAuthRedirectUri,
} from "@server/services/emailHub/mailbox/emailHubMailboxConfig";
import { requireEmailHubSession } from "../../../lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "email_hub_gmail_oauth_state";

export async function GET(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!getGmailMailboxOAuthClient().ok) {
    return NextResponse.json(
      { message: "Set EMAIL_HUB_GMAIL_CLIENT_ID and EMAIL_HUB_GMAIL_CLIENT_SECRET in the environment." },
      { status: 400 },
    );
  }
  const baseUrl = getEmailHubAppBaseUrl(req, req.nextUrl.origin);
  const redirectUri = mailboxOAuthRedirectUri(baseUrl, "gmail");
  const state = randomBytes(24).toString("hex");
  const url = buildGmailMailboxAuthorizeUrl(state, redirectUri);
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
