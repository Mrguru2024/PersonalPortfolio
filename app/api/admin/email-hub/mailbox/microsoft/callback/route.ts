import { NextRequest, NextResponse } from "next/server";
import { connectMicrosoftMailboxFromCode } from "@server/services/emailHub/mailbox/emailHubMailboxConnect";
import {
  getEmailHubAppBaseUrl,
  mailboxOAuthRedirectUri,
} from "@server/services/emailHub/mailbox/emailHubMailboxConfig";
import { requireEmailHubSession } from "../../../lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "email_hub_ms_oauth_state";

function redirectInbox(baseUrl: string, query: string): NextResponse {
  const res = NextResponse.redirect(`${baseUrl.replace(/\/$/, "")}/admin/email-hub/inbox${query}`);
  res.cookies.delete(STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) {
    const rawBase = getEmailHubAppBaseUrl(req, req.nextUrl.origin);
    return redirectInbox(rawBase, "?mailbox_error=unauthorized");
  }

  const baseUrl = getEmailHubAppBaseUrl(req, req.nextUrl.origin);
  const redirectUri = mailboxOAuthRedirectUri(baseUrl, "microsoft");
  const { searchParams } = new URL(req.url);
  const err = searchParams.get("error");
  if (err) {
    return redirectInbox(baseUrl, `?mailbox_error=${encodeURIComponent(err)}`);
  }
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = req.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectInbox(baseUrl, "?mailbox_error=invalid_state");
  }

  const saved = await connectMicrosoftMailboxFromCode(user.id, code, redirectUri);
  if (!saved.ok) {
    return redirectInbox(baseUrl, `?mailbox_error=${encodeURIComponent(saved.error)}`);
  }
  return redirectInbox(baseUrl, "?mailbox_connected=microsoft");
}
