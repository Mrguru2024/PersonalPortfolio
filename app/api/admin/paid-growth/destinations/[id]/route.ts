import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { PPC_DESTINATION_KINDS } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

function okKind(s: unknown): s is (typeof PPC_DESTINATION_KINDS)[number] {
  return typeof s === "string" && (PPC_DESTINATION_KINDS as readonly string[]).includes(s);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json().catch(() => ({}));
    const updates: Parameters<typeof storage.updatePpcCampaignDestination>[1] = {};
    if (okKind(body.kind)) updates.kind = body.kind;
    if (typeof body.path === "string" && body.path.startsWith("/")) updates.path = body.path.trim();
    if (typeof body.offerSlug === "string") updates.offerSlug = body.offerSlug;
    if (typeof body.weight === "number" && body.weight > 0) updates.weight = body.weight;
    if (typeof body.notes === "string") updates.notes = body.notes;
    const updated = await storage.updatePpcCampaignDestination(id, updates);
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
    await storage.deletePpcCampaignDestination(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
