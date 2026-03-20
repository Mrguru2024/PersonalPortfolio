import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listRecentGosAuditEvents } from "@server/services/growthOsFoundationService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/growth-os/recent security audit events (Growth OS scoped). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "30", 10) || 30),
    );

    const events = await listRecentGosAuditEvents(limit);
    return NextResponse.json({ events });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[GET /api/admin/growth-os/audit]", msg);
    return NextResponse.json(
      { error: "Server error", message: "Failed to list audit events" },
      { status: 500 },
    );
  }
}
