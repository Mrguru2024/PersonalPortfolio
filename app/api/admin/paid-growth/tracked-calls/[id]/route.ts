import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import type { PpcTrackedCall } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

/** PATCH — verification / billable / disposition for call queue. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { id: idStr } = await ctx.params;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const updates: Partial<PpcTrackedCall> = {};

    if (typeof body.verificationStatus === "string" && body.verificationStatus.trim()) {
      updates.verificationStatus = body.verificationStatus.trim();
    }
    if (typeof body.billableStatus === "string" && body.billableStatus.trim()) {
      updates.billableStatus = body.billableStatus.trim();
    }
    if (typeof body.disposition === "string")
      updates.disposition = body.disposition.trim() || null;
    if (typeof body.answeredByClient === "boolean") updates.answeredByClient = body.answeredByClient;
    if (body.durationSeconds != null && body.durationSeconds !== "") {
      const n = Number(body.durationSeconds);
      if (Number.isFinite(n)) updates.durationSeconds = Math.max(0, Math.round(n));
    }
    if (body.metadataJson != null && typeof body.metadataJson === "object" && !Array.isArray(body.metadataJson)) {
      updates.metadataJson = body.metadataJson as Record<string, unknown>;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const row = await storage.updatePpcTrackedCall(id, updates);
    return NextResponse.json({
      call: {
        ...row,
        contact: row.crmContactId != null ? (await storage.getCrmContactById(row.crmContactId)) ?? null : null,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
