import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { PPC_AD_GROUP_STATUSES } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

function okStatus(s: unknown): s is (typeof PPC_AD_GROUP_STATUSES)[number] {
  return typeof s === "string" && (PPC_AD_GROUP_STATUSES as readonly string[]).includes(s);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json().catch(() => ({}));
    const updates: Parameters<typeof storage.updatePpcAdGroup>[1] = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (okStatus(body.status)) updates.status = body.status;
    if (typeof body.serviceCategory === "string") updates.serviceCategory = body.serviceCategory;
    if (body.deviceSegmentJson && typeof body.deviceSegmentJson === "object")
      updates.deviceSegmentJson = body.deviceSegmentJson;
    if (typeof body.sortOrder === "number") updates.sortOrder = body.sortOrder;
    if (typeof body.strategyNotes === "string") updates.strategyNotes = body.strategyNotes;
    const updated = await storage.updatePpcAdGroup(id, updates);
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    await storage.deletePpcAdGroup(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
