import { NextRequest, NextResponse } from "next/server";
import { getClientSafeShareByRawToken, logGosAccessEvent } from "@server/services/growthOsFoundationService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/public/gos/report/[token]
 * Tokenized client-safe payloads only (no session). Rate-limit at edge in production if needed.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!token?.trim()) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
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
