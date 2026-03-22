import { NextRequest, NextResponse } from "next/server";
import { ensureAbsoluteUrl } from "@/lib/siteUrl";
import {
  getGoogleCalendarRedirectUri,
  saveGoogleCalendarTokensFromCode,
} from "@server/services/googleCalendarSchedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "gcal_oauth_state";

function redirectWithCookieClear(baseUrl: string, query: string): NextResponse {
  const res = NextResponse.redirect(`${baseUrl}/admin/integrations${query}`);
  res.cookies.delete(STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const rawBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    req.headers.get("origin")?.replace(/\/$/, "") ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  const baseUrl = ensureAbsoluteUrl(rawBase || "http://localhost:3000");
  const redirectUri = getGoogleCalendarRedirectUri(baseUrl);

  const { searchParams } = new URL(req.url);
  const err = searchParams.get("error");
  if (err) {
    return redirectWithCookieClear(baseUrl, `?gcal_error=${encodeURIComponent(err)}`);
  }
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = req.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectWithCookieClear(baseUrl, "?gcal_error=invalid_state");
  }

  const saved = await saveGoogleCalendarTokensFromCode(code, redirectUri);
  if (!saved.ok) {
    return redirectWithCookieClear(baseUrl, `?gcal_error=${encodeURIComponent(saved.error)}`);
  }
  return redirectWithCookieClear(baseUrl, "?gcal=connected");
}
