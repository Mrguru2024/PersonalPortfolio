import { NextRequest, NextResponse } from "next/server";
import { getClientSafeShareByRawToken, logGosAccessEvent } from "@server/services/growthOsFoundationService";
import { checkPublicApiRateLimitAsync, getClientIp } from "@/lib/public-api-rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function maxPerMinute(): number {
  const raw = process.env.GOS_PUBLIC_REPORT_MAX_PER_MINUTE;
  const n = raw ? parseInt(raw, 10) : 60;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 300) : 60;
}

/**
 * GET /api/public/gos/report/[token]
 * Tokenized client-safe payloads only (no session). Rate-limited per IP in production.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!token?.trim()) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    if (process.env.NODE_ENV === "production") {
      const ip = getClientIp(req);
      const limit = maxPerMinute();
      const rl = await checkPublicApiRateLimitAsync(`gos-report:${ip}`, limit, 60_000);
      if (!rl.ok) {
        const retry = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429, headers: { "Retry-After": String(retry) } },
        );
      }
    }

    const resolved = await getClientSafeShareByRawToken(decodeURIComponent(token));
    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.reason === "expired" ? "Link expired" : "Not found" },
        { status: 404 },
      );
    }

    await logGosAccessEvent({
      actorUserId: null,
      action: "client_safe_report_viewed",
      resourceType: resolved.share.resourceType,
      resourceId: resolved.share.resourceId,
      visibilityContext: "client_visible",
      metadata: { shareId: resolved.share.id },
    });

    return NextResponse.json({
      ok: true,
      dataProvenance: "client_share_token",
      resourceType: resolved.share.resourceType,
      resourceId: resolved.share.resourceId,
      summary: resolved.share.summaryPayload,
      expiresAt: resolved.share.expiresAt?.toISOString() ?? null,
    });
  } catch (e: unknown) {
    console.error("[GET /api/public/gos/report]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
