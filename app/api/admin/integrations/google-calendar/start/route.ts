import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isSuperUser } from "@/lib/auth-helpers";
import { ensureAbsoluteUrl } from "@/lib/siteUrl";
import {
  buildGoogleCalendarAuthorizeUrl,
  getGoogleCalendarRedirectUri,
  isGoogleCalendarOAuthConfigured,
} from "@server/services/googleCalendarSchedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "gcal_oauth_state";

export async function GET(req: NextRequest) {
  if (!(await isSuperUser(req))) {
    return NextResponse.json({ message: "Super user access required" }, { status: 403 });
  }
  if (!isGoogleCalendarOAuthConfigured()) {
    return NextResponse.json(
      { message: "Set GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET in environment." },
      { status: 400 },
    );
  }
  const rawBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    req.headers.get("origin")?.replace(/\/$/, "") ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  const baseUrl = ensureAbsoluteUrl(rawBase || "http://localhost:3000");
  const redirectUri = getGoogleCalendarRedirectUri(baseUrl);
  const state = randomBytes(24).toString("hex");
  const url = buildGoogleCalendarAuthorizeUrl(state, redirectUri);
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
