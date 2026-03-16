import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { getGeoFromRequest } from "@/lib/geo-from-request";
import { isLeadTrackingEventType, DEFAULT_TRACKING_EVENT_TYPE } from "@/lib/lead-tracking-types";
import { addScoreFromEvent } from "@server/services/leadScoringService";

export const dynamic = "force-dynamic";
const METADATA_MAX_STRING = 1024;
const GEO_MAX_LENGTH = 128;

function sanitizeMetadata(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.length > 64) continue;
    if (typeof v === "string") out[k] = v.slice(0, METADATA_MAX_STRING);
    else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (v !== null && typeof v === "object" && !Array.isArray(v)) out[k] = sanitizeMetadata(v as Record<string, unknown>);
  }
  return out;
}

/** POST /api/track/visitor — record anonymous/attributed visitor activity. Public, rate-limit by IP in production. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const visitorId = typeof body.visitorId === "string" ? body.visitorId.trim().slice(0, 128) : null;
    const eventType =
      typeof body.eventType === "string" && isLeadTrackingEventType(body.eventType)
        ? body.eventType
        : DEFAULT_TRACKING_EVENT_TYPE;
    const pageVisited = typeof body.pageVisited === "string" ? body.pageVisited.trim().slice(0, 512) : undefined;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim().slice(0, 128) : undefined;
    const referrer = typeof body.referrer === "string" ? body.referrer.trim().slice(0, 512) : undefined;
    const leadId = typeof body.leadId === "number" ? body.leadId : undefined;

    if (!visitorId) {
      return NextResponse.json({ error: "visitorId required" }, { status: 400 });
    }

    const ua = req.headers.get("user-agent") || undefined;
    const deviceType = ua && /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";

    const geo = getGeoFromRequest(req);
    const country = geo.country ? geo.country.slice(0, GEO_MAX_LENGTH) : null;
    const region = geo.region ? geo.region.slice(0, GEO_MAX_LENGTH) : null;
    const city = geo.city ? geo.city.slice(0, GEO_MAX_LENGTH) : null;
    const timezone = geo.timezone ? geo.timezone.slice(0, GEO_MAX_LENGTH) : null;

    const viewport = body.viewport;
    const vw = viewport && (typeof viewport.width === "number" || typeof viewport.w === "number") ? (viewport.width ?? viewport.w) : undefined;
    const vh = viewport && (typeof viewport.height === "number" || typeof viewport.h === "number") ? (viewport.height ?? viewport.h) : undefined;
    const viewportStr = typeof vw === "number" && typeof vh === "number" ? `${vw}x${vh}` : undefined;

    const baseMeta = typeof body.metadata === "object" && body.metadata !== null ? sanitizeMetadata(body.metadata as Record<string, unknown>) : {};
    const metadata: Record<string, unknown> = {
      ...baseMeta,
      ...(ua ? { userAgent: ua.slice(0, 512) } : {}),
      ...(viewportStr ? { viewport: viewportStr } : {}),
    };

    const activity = await storage.createVisitorActivity({
      visitorId,
      leadId: leadId ?? null,
      sessionId: sessionId ?? null,
      pageVisited: pageVisited ?? null,
      eventType,
      referrer: referrer ?? null,
      deviceType: deviceType ?? null,
      country,
      region,
      city,
      timezone,
      metadata: Object.keys(metadata).length ? metadata : undefined,
    });

    if (leadId != null && eventType !== "page_view") {
      addScoreFromEvent(storage, leadId, eventType, {
        page: pageVisited ?? undefined,
        component: baseMeta?.component as string | undefined,
      }).catch(() => {});
    } else if (leadId != null && eventType === "page_view" && pageVisited) {
      addScoreFromEvent(storage, leadId, "page_view", { page: pageVisited }).catch(() => {});
    }

    return NextResponse.json({ ok: true, id: activity.id });
  } catch (e) {
    console.error("Visitor track error:", e);
    return NextResponse.json({ error: "Failed to record activity" }, { status: 500 });
  }
}
