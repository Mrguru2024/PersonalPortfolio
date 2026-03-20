import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser, resolveAscendraAccessFromSessionUser } from "@/lib/auth-helpers";
import {
  ensureGosDefaultModules,
  listGosModules,
  listEntityVisibilityOverrides,
} from "@server/services/growthOsFoundationService";
import { DATA_VISIBILITY_TIERS } from "@shared/accessScope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/growth-os/bootstrap
 * Phase 1: approved admins only. Seeds module registry if empty; returns access + modules + visibility enum.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 },
      );
    }

    const user = await getSessionUser(req);
    await ensureGosDefaultModules();
    const modules = await listGosModules();
    const visibilityOverrides = await listEntityVisibilityOverrides();

    return NextResponse.json({
      phase: 1,
      accessRole: resolveAscendraAccessFromSessionUser(user),
      dataVisibilityTiers: [...DATA_VISIBILITY_TIERS],
      modules,
      visibilityOverrides,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[GET /api/admin/growth-os/bootstrap]", msg);
    return NextResponse.json(
      { error: "Server error", message: "Failed to load Growth OS bootstrap" },
      { status: 500 },
    );
  }
}
