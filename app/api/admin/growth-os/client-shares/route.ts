import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  createClientSafeReportShare,
  logGosAccessEvent,
} from "@server/services/growthOsFoundationService";
import { stripForbiddenKeys } from "@/lib/growth-os/sanitize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const postBodySchema = z.object({
  resourceType: z.string().min(1).max(120),
  resourceId: z.string().min(1).max(256),
  /** Sanitized summary only — never send full internal reports here. */
  summaryPayload: z.record(z.unknown()),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * POST /api/admin/growth-os/client-shares
 * Creates a tokenized share. Returns raw token once; store hash only in DB.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 },
      );
    }

    const user = await getSessionUser(req);
    const body = await req.json().catch(() => null);
    const parsed = postBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const cleaned = stripForbiddenKeys(
      parsed.data.summaryPayload as Record<string, unknown>,
    );

    let expiresAt: Date | null = null;
    if (parsed.data.expiresAt != null && parsed.data.expiresAt.trim() !== "") {
      const d = new Date(parsed.data.expiresAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "Validation error", message: "Invalid expiresAt date" },
          { status: 400 },
        );
      }
      expiresAt = d;
    }

    const { id, rawToken } = await createClientSafeReportShare({
      resourceType: parsed.data.resourceType,
      resourceId: parsed.data.resourceId,
      summaryPayload: cleaned,
      expiresAt,
      createdByUserId: user?.id ?? null,
    });

    await logGosAccessEvent({
      actorUserId: user?.id ?? null,
      action: "client_safe_share_created",
      resourceType: parsed.data.resourceType,
      resourceId: parsed.data.resourceId,
      visibilityContext: "client_visible",
      metadata: { shareId: id },
    });

    const enc = encodeURIComponent(rawToken);
    return NextResponse.json({
      id,
      token: rawToken,
      apiUrl: `/api/public/gos/report/${enc}`,
      pageUrl: `/gos/report/${enc}`,
      message:
        "Store this token securely; it cannot be retrieved again. Use hashed lookup server-side only.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[POST /api/admin/growth-os/client-shares]", msg);
    return NextResponse.json(
      { error: "Server error", message: "Failed to create client share" },
      { status: 500 },
    );
  }
}
