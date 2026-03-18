import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ASC_ATTR_FIRST_COOKIE,
  ASC_ATTR_LAST_COOKIE,
} from "@/lib/analytics/attribution";

const ATTR_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

function sanitize(value: string | null, max = 256): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function parseFirstLastPayload(req: NextRequest, cookieName: string): Record<string, string> | null {
  const raw = req.cookies.get(cookieName)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const normalized = Object.fromEntries(
      Object.entries(parsed)
        .map(([k, v]) => [k, typeof v === "string" ? sanitize(v) : null])
        .filter(([, v]) => Boolean(v))
    ) as Record<string, string>;
    return Object.keys(normalized).length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

function getAttributionFromQuery(req: NextRequest): Record<string, string> {
  const params = req.nextUrl.searchParams;
  const payload: Record<string, string> = {};
  const keys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
    "msclkid",
    "ttclid",
  ] as const;

  for (const key of keys) {
    const value = sanitize(params.get(key));
    if (value) payload[key] = value;
  }

  const referer = sanitize(req.headers.get("referer"), 1024);
  const landingPage = sanitize(req.nextUrl.pathname + req.nextUrl.search, 1024);
  if (referer) payload.referrer = referer;
  if (landingPage) payload.landing_page = landingPage;
  if (landingPage) payload.url = sanitize(req.nextUrl.toString(), 1024) ?? landingPage;
  payload.captured_at = new Date().toISOString();

  return payload;
}

export function middleware(req: NextRequest) {
  const queryAttr = getAttributionFromQuery(req);
  const hasCampaignSignal = [
    queryAttr.utm_source,
    queryAttr.utm_medium,
    queryAttr.utm_campaign,
    queryAttr.utm_term,
    queryAttr.utm_content,
    queryAttr.gclid,
    queryAttr.fbclid,
    queryAttr.msclkid,
    queryAttr.ttclid,
  ].some(Boolean);

  if (!hasCampaignSignal) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const firstTouch = parseFirstLastPayload(req, ASC_ATTR_FIRST_COOKIE);
  const lastTouch = parseFirstLastPayload(req, ASC_ATTR_LAST_COOKIE);

  const nextLast = {
    ...(lastTouch ?? {}),
    ...queryAttr,
  };
  res.cookies.set(ASC_ATTR_LAST_COOKIE, JSON.stringify(nextLast), {
    path: "/",
    maxAge: ATTR_MAX_AGE_SECONDS,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    httpOnly: false,
  });

  if (!firstTouch) {
    res.cookies.set(ASC_ATTR_FIRST_COOKIE, JSON.stringify(queryAttr), {
      path: "/",
      maxAge: ATTR_MAX_AGE_SECONDS,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
      httpOnly: false,
    });
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\..*).*)",
  ],
};
