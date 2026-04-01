import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { getAscendraOsPublicAccessState } from "@/lib/ascendraOsAccess";

export const dynamic = "force-dynamic";

/** GET /api/admin/platform/ascendra-os — Ascendra OS public vs internal toggle (global). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const row = await storage.getAscendraOsSettings();
    const state = await getAscendraOsPublicAccessState();
    return NextResponse.json({
      publicAccessEnabled: row.publicAccessEnabled,
      effectivePublicAccessEnabled: state.effectivePublicAccessEnabled,
      envLockForcesInternal: state.envLockForcesInternal,
      updatedAt: row.updatedAt?.toISOString?.() ?? null,
    });
  } catch (e) {
    console.error("GET ascendra-os platform settings:", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

/** PATCH /api/admin/platform/ascendra-os — update stored toggle (environment lock still overrides). */
export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    if (typeof body.publicAccessEnabled !== "boolean") {
      return NextResponse.json({ error: "publicAccessEnabled boolean required" }, { status: 400 });
    }
    const updated = await storage.upsertAscendraOsSettings({
      publicAccessEnabled: body.publicAccessEnabled,
    });
    const state = await getAscendraOsPublicAccessState();
    return NextResponse.json({
      publicAccessEnabled: updated.publicAccessEnabled,
      effectivePublicAccessEnabled: state.effectivePublicAccessEnabled,
      envLockForcesInternal: state.envLockForcesInternal,
      updatedAt: updated.updatedAt?.toISOString?.() ?? null,
    });
  } catch (e) {
    console.error("PATCH ascendra-os platform settings:", e);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
