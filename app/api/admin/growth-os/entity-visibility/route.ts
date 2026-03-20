import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  listEntityVisibilityOverrides,
  upsertEntityVisibilityOverride,
  logGosAccessEvent,
} from "@server/services/growthOsFoundationService";
import { parseDataVisibilityTier } from "@shared/accessScope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const putBodySchema = z.object({
  entityType: z.string().min(1).max(120),
  entityId: z.string().min(1).max(256),
  visibility: z.string().min(1).max(32),
});

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 },
      );
    }
    const rows = await listEntityVisibilityOverrides();
    return NextResponse.json({ overrides: rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[GET /api/admin/growth-os/entity-visibility]", msg);
    return NextResponse.json(
      { error: "Server error", message: "Failed to list visibility overrides" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 },
      );
    }

    const user = await getSessionUser(req);
    const body = await req.json().catch(() => null);
    const parsed = putBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const tier = parseDataVisibilityTier(parsed.data.visibility);
    if (!tier) {
      return NextResponse.json(
        { error: "Validation error", message: "Invalid visibility tier" },
        { status: 400 },
      );
    }

    const id = await upsertEntityVisibilityOverride({
      entityType: parsed.data.entityType,
      entityId: parsed.data.entityId,
      visibility: tier,
      updatedByUserId: user?.id ?? null,
    });

    await logGosAccessEvent({
      actorUserId: user?.id ?? null,
      action: "entity_visibility_upserted",
      resourceType: parsed.data.entityType,
      resourceId: parsed.data.entityId,
      visibilityContext: tier,
      metadata: { overrideRowId: id },
    });

    return NextResponse.json({ ok: true, id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[PUT /api/admin/growth-os/entity-visibility]", msg);
    return NextResponse.json(
      { error: "Server error", message: "Failed to update visibility override" },
      { status: 500 },
    );
  }
}
