import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { leadControlOrgConfigPutSchema } from "@shared/leadControlRoutingRulesZod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/lead-control/routing-rules — org routing rules (singleton config row). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const row = await storage.getLeadControlOrgSettings();
    return NextResponse.json({
      routingRules: row.config?.routingRules ?? [],
      updatedAt: row.updatedAt,
    });
  } catch (e) {
    console.error("[GET /api/admin/lead-control/routing-rules]", e);
    return NextResponse.json({ error: "Failed to load routing rules" }, { status: 500 });
  }
}

/** PUT /api/admin/lead-control/routing-rules — replace routing rules (hints still stored on crm_contacts). */
export async function PUT(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const json = await req.json().catch(() => null);
    const parsed = leadControlOrgConfigPutSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const normalized = parsed.data.routingRules.map((r) => ({
      ...r,
      hint: r.hint.trim(),
      label: r.label?.trim() ? r.label.trim() : undefined,
    }));
    const row = await storage.upsertLeadControlOrgSettings({ routingRules: normalized });
    return NextResponse.json({
      ok: true,
      routingRules: row.config.routingRules,
      updatedAt: row.updatedAt,
    });
  } catch (e) {
    console.error("[PUT /api/admin/lead-control/routing-rules]", e);
    return NextResponse.json({ error: "Failed to save routing rules" }, { status: 500 });
  }
}
