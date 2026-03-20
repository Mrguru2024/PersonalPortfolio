import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { createShareFromBuiltResource } from "@server/services/growthOsClientSafeExposureService";
import { logGosAccessEvent } from "@server/services/growthOsFoundationService";
import { isClientSafeResourceType } from "@shared/clientSafe/gosExposurePolicies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  resourceType: z.string().min(1).max(120),
  resourceId: z.string().min(1).max(512),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * POST /api/admin/growth-os/client-safe/build-share
 * Builds a policy-sanitized envelope from live data, then creates a token share.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    if (!isClientSafeResourceType(parsed.data.resourceType)) {
      return NextResponse.json({ error: "Unsupported resourceType" }, { status: 400 });
    }

    let expiresAt: Date | null = null;
    if (parsed.data.expiresAt) {
      const d = new Date(parsed.data.expiresAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid expiresAt" }, { status: 400 });
      }
      expiresAt = d;
    }

    const out = await createShareFromBuiltResource({
      resourceType: parsed.data.resourceType,
      resourceId: parsed.data.resourceId,
      expiresAt,
      createdByUserId: user?.id ?? null,
    });

    if ("error" in out) {
      return NextResponse.json({ error: out.error }, { status: 400 });
    }

    await logGosAccessEvent({
      actorUserId: user?.id ?? null,
      action: "client_safe_built_share_created",
      resourceType: parsed.data.resourceType,
      resourceId: parsed.data.resourceId,
      visibilityContext: "client_visible",
      metadata: { shareId: out.id },
    });

    return NextResponse.json({
      id: out.id,
      token: out.rawToken,
      viewUrl: `/api/public/gos/report/${encodeURIComponent(out.rawToken)}`,
    });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
