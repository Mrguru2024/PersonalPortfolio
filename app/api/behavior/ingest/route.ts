import { NextRequest, NextResponse } from "next/server";
import { checkPublicApiRateLimitAsync, getClientIp } from "@/lib/public-api-rate-limit";
import { ingestBehaviorPayload } from "@server/services/behavior/behaviorIngestService";
import { behaviorIngestPayloadSchema } from "@shared/behaviorIngestPayload";
import { storage } from "@server/storage";
import { DEFAULT_TRACKING_EVENT_TYPE } from "@shared/leadTrackingTypes";
import type { LeadTrackingEventType } from "@shared/leadTrackingTypes";
import { isLeadTrackingEventType } from "@shared/leadTrackingTypes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const MAX_REQ_PER_WINDOW = 120;

function verifyIngestSecret(req: NextRequest): boolean {
  const secret = process.env.BEHAVIOR_INGEST_SECRET?.trim();
  /** Browser-safe token (set `NEXT_PUBLIC_BEHAVIOR_INGEST_TOKEN` to the same value). */
  const publicToken = process.env.BEHAVIOR_INGEST_PUBLIC_TOKEN?.trim();
  if (!secret && !publicToken) return true;
  const auth = req.headers.get("authorization")?.trim();
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  if (secret && token === secret) return true;
  if (publicToken && token === publicToken) return true;
  return false;
}

/**
 * POST /api/behavior/ingest — Behavior Intelligence ingestion (replay segments, clicks, heatmap, surveys).
 * Optional auth: `BEHAVIOR_INGEST_SECRET` and/or `BEHAVIOR_INGEST_PUBLIC_TOKEN` (Bearer). Use the public token in the browser via `NEXT_PUBLIC_BEHAVIOR_INGEST_TOKEN`.
 * Bridges high-value events to visitor_activity when visitorId present in payload.eventData (optional).
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifyIngestSecret(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const limited = await checkPublicApiRateLimitAsync(`behavior-ingest:${ip}`, MAX_REQ_PER_WINDOW, WINDOW_MS);
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const parsed = behaviorIngestPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    await ingestBehaviorPayload({
      sessionId: data.sessionId,
      userId: data.userId,
      businessId: data.businessId,
      crmContactId: data.crmContactId,
      device: data.device,
      url: data.url,
      utm: data.utm,
      converted: data.converted,
      optOut: data.optOut,
      events: data.events,
      replaySegments: data.replaySegments,
      heatmapPoints: data.heatmapPoints,
      surveyResponses: data.surveyResponses,
    });

    /** Optional bridge: mirror select funnel events to visitor_activity when visitorId is present */
    const bridgeTypes = new Set([
      "cta_click",
      "form_submit",
      "form_completed",
      "form_start",
      "form_started",
      "form_abandon",
      "booking_click",
      "page_view",
    ]);
    const bridge = data.events.filter(
      (e) => bridgeTypes.has(e.eventType) && e.eventData && typeof (e.eventData as { visitorId?: string }).visitorId === "string",
    );
    for (const e of bridge.slice(0, 15)) {
      const ev = e.eventData as { visitorId?: string; leadId?: number; pageVisited?: string };
      const visitorId = ev.visitorId;
      if (!visitorId) continue;
      const eventTypeRaw = e.eventType;
      const eventType = isLeadTrackingEventType(eventTypeRaw) ? eventTypeRaw : DEFAULT_TRACKING_EVENT_TYPE;
      try {
        await storage.createVisitorActivity({
          visitorId,
          leadId: typeof ev.leadId === "number" ? ev.leadId : null,
          sessionId: data.sessionId,
          pageVisited: ev.pageVisited ?? data.url ?? null,
          eventType: eventType as LeadTrackingEventType,
          referrer: null,
          deviceType: data.device ?? null,
          metadata: { ...(e.eventData ?? {}), behavior_bridge: true },
        });
      } catch {
        /* non-fatal */
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[behavior/ingest]", err);
    return NextResponse.json({ error: "Ingest failed" }, { status: 500 });
  }
}
