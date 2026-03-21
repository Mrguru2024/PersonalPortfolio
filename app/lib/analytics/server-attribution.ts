import type { NextRequest } from "next/server";
import {
  ASC_ATTR_FIRST_COOKIE,
  ASC_ATTR_LAST_COOKIE,
  ASC_SESSION_COOKIE,
  ASC_VISITOR_COOKIE,
  type TrackingAttributionPayload,
} from "@/lib/analytics/attribution";

interface NormalizedAttributionResult {
  attribution: TrackingAttributionPayload;
  firstTouch: TrackingAttributionPayload | null;
  lastTouch: TrackingAttributionPayload | null;
}

function sanitize(value: unknown, max = 1024): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function parseCookieJson(value: string | undefined): TrackingAttributionPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const normalized = Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [k, sanitize(v)])
    ) as TrackingAttributionPayload;
    return normalized;
  } catch {
    return null;
  }
}

export function extractRequestAttribution(
  req: NextRequest,
  body?: Record<string, unknown>
): NormalizedAttributionResult {
  const params = req.nextUrl.searchParams;
  const bodyRecord = body ?? {};
  const bodyFirstTouch =
    bodyRecord.first_touch && typeof bodyRecord.first_touch === "object"
      ? (bodyRecord.first_touch as Record<string, unknown>)
      : {};
  const bodyLastTouch =
    bodyRecord.last_touch && typeof bodyRecord.last_touch === "object"
      ? (bodyRecord.last_touch as Record<string, unknown>)
      : {};

  const firstTouch = {
    ...parseCookieJson(req.cookies.get(ASC_ATTR_FIRST_COOKIE)?.value),
    ...Object.fromEntries(
      Object.entries(bodyFirstTouch)
        .map(([k, v]) => [k, sanitize(v)])
        .filter(([, v]) => Boolean(v))
    ),
  } as TrackingAttributionPayload;
  const lastTouch = {
    ...parseCookieJson(req.cookies.get(ASC_ATTR_LAST_COOKIE)?.value),
    ...Object.fromEntries(
      Object.entries(bodyLastTouch)
        .map(([k, v]) => [k, sanitize(v)])
        .filter(([, v]) => Boolean(v))
    ),
  } as TrackingAttributionPayload;

  const attribution: TrackingAttributionPayload = {
    visitorId:
      sanitize(bodyRecord.visitorId, 128) ??
      sanitize(bodyRecord.visitor_id, 128) ??
      sanitize(req.cookies.get(ASC_VISITOR_COOKIE)?.value, 128),
    sessionId:
      sanitize(bodyRecord.sessionId, 128) ??
      sanitize(bodyRecord.session_id, 128) ??
      sanitize(req.cookies.get(ASC_SESSION_COOKIE)?.value, 128),
    utm_source:
      sanitize(bodyRecord.utm_source, 128) ??
      sanitize(bodyRecord.utmSource, 128) ??
      sanitize(params.get("utm_source"), 128) ??
      lastTouch?.utm_source ??
      firstTouch?.utm_source ??
      null,
    utm_medium:
      sanitize(bodyRecord.utm_medium, 128) ??
      sanitize(bodyRecord.utmMedium, 128) ??
      sanitize(params.get("utm_medium"), 128) ??
      lastTouch?.utm_medium ??
      firstTouch?.utm_medium ??
      null,
    utm_campaign:
      sanitize(bodyRecord.utm_campaign, 128) ??
      sanitize(bodyRecord.utmCampaign, 128) ??
      sanitize(params.get("utm_campaign"), 128) ??
      lastTouch?.utm_campaign ??
      firstTouch?.utm_campaign ??
      null,
    utm_term:
      sanitize(bodyRecord.utm_term, 128) ??
      sanitize(bodyRecord.utmTerm, 128) ??
      sanitize(params.get("utm_term"), 128) ??
      lastTouch?.utm_term ??
      firstTouch?.utm_term ??
      null,
    utm_content:
      sanitize(bodyRecord.utm_content, 128) ??
      sanitize(bodyRecord.utmContent, 128) ??
      sanitize(params.get("utm_content"), 128) ??
      lastTouch?.utm_content ??
      firstTouch?.utm_content ??
      null,
    gclid:
      sanitize(bodyRecord.gclid, 128) ??
      sanitize(params.get("gclid"), 128) ??
      lastTouch?.gclid ??
      firstTouch?.gclid ??
      null,
    fbclid:
      sanitize(bodyRecord.fbclid, 128) ??
      sanitize(params.get("fbclid"), 128) ??
      lastTouch?.fbclid ??
      firstTouch?.fbclid ??
      null,
    msclkid:
      sanitize(bodyRecord.msclkid, 128) ??
      sanitize(params.get("msclkid"), 128) ??
      lastTouch?.msclkid ??
      firstTouch?.msclkid ??
      null,
    ttclid:
      sanitize(bodyRecord.ttclid, 128) ??
      sanitize(params.get("ttclid"), 128) ??
      lastTouch?.ttclid ??
      firstTouch?.ttclid ??
      null,
    referrer:
      sanitize(bodyRecord.referrer, 1024) ??
      sanitize(bodyRecord.referringPage, 1024) ??
      sanitize(req.headers.get("referer"), 1024) ??
      lastTouch?.referrer ??
      firstTouch?.referrer ??
      null,
    landing_page:
      sanitize(bodyRecord.landing_page, 1024) ??
      sanitize(bodyRecord.landingPage, 1024) ??
      sanitize(req.nextUrl.pathname + req.nextUrl.search, 1024) ??
      lastTouch?.landing_page ??
      firstTouch?.landing_page ??
      null,
    url:
      sanitize(bodyRecord.url, 1024) ??
      sanitize(req.nextUrl.toString(), 1024) ??
      lastTouch?.url ??
      null,
  };

  const normalizedFirstTouch = Object.keys(firstTouch).length ? firstTouch : null;
  const normalizedLastTouch = Object.keys(lastTouch).length ? lastTouch : null;
  return { attribution, firstTouch: normalizedFirstTouch, lastTouch: normalizedLastTouch };
}
