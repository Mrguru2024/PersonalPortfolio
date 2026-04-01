import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { PPC_BILLING_MODELS } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

function okModel(s: unknown): s is (typeof PPC_BILLING_MODELS)[number] {
  return typeof s === "string" && (PPC_BILLING_MODELS as readonly string[]).includes(s);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json().catch(() => ({}));
    const updates: Parameters<typeof storage.updatePpcBillingProfile>[1] = {};
    if (typeof body.ppcAdAccountId === "number") updates.ppcAdAccountId = body.ppcAdAccountId;
    if (body.ppcAdAccountId === null) updates.ppcAdAccountId = null;
    if (typeof body.clientLabel === "string") updates.clientLabel = body.clientLabel;
    if (okModel(body.billingModel)) updates.billingModel = body.billingModel;
    if (typeof body.setupFeeCents === "number") updates.setupFeeCents = body.setupFeeCents;
    if (typeof body.monthlyRetainerCents === "number") updates.monthlyRetainerCents = body.monthlyRetainerCents;
    if (typeof body.performanceBonusNotes === "string") updates.performanceBonusNotes = body.performanceBonusNotes;
    if (typeof body.laborEstimateHours === "number") updates.laborEstimateHours = body.laborEstimateHours;
    if (typeof body.internalProfitabilityScore === "number")
      updates.internalProfitabilityScore = body.internalProfitabilityScore;
    if (typeof body.fulfillmentNotes === "string") updates.fulfillmentNotes = body.fulfillmentNotes;
    const updated = await storage.updatePpcBillingProfile(id, updates);
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
    await storage.deletePpcBillingProfile(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
