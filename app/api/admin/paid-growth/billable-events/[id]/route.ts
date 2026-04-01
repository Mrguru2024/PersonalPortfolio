import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import type { PpcBillableEvent } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/paid-growth/billable-events/[id] — status, dispute notes, amount. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { id: idStr } = await ctx.params;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const updates: Partial<PpcBillableEvent> = {};
    if (typeof body.status === "string" && body.status.trim()) updates.status = body.status.trim();
    if (typeof body.disputeNotes === "string") updates.disputeNotes = body.disputeNotes;
    if (body.amountCents != null && body.amountCents !== "") {
      const n = Number(body.amountCents);
      if (Number.isFinite(n)) updates.amountCents = Math.round(n);
    }
    if (body.metadataJson != null && typeof body.metadataJson === "object" && !Array.isArray(body.metadataJson)) {
      updates.metadataJson = body.metadataJson as Record<string, unknown>;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const row = await storage.updatePpcBillableEvent(id, updates);
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
