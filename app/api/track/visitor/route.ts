import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

const ALLOWED_EVENT_TYPES = ["page_view", "form_started", "form_completed", "cta_click", "tool_used"];
const METADATA_MAX_STRING = 1024;

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
    const eventType = typeof body.eventType === "string" && ALLOWED_EVENT_TYPES.includes(body.eventType) ? body.eventType : "page_view";
    const pageVisited = typeof body.pageVisited === "string" ? body.pageVisited.trim().slice(0, 512) : undefined;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim().slice(0, 128) : undefined;
    const referrer = typeof body.referrer === "string" ? body.referrer.trim().slice(0, 512) : undefined;
    const leadId = typeof body.leadId === "number" ? body.leadId : undefined;

    if (!visitorId) {
      return NextResponse.json({ error: "visitorId required" }, { status: 400 });
    }

    const ua = req.headers.get("user-agent") || undefined;
    const deviceType = ua && /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";

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
      metadata: Object.keys(metadata).length ? metadata : undefined,
    });

    return NextResponse.json({ ok: true, id: activity.id });
  } catch (e) {
    console.error("Visitor track error:", e);
    return NextResponse.json({ error: "Failed to record activity" }, { status: 500 });
  }
}
