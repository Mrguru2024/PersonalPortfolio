import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { PPC_BILLING_MODELS } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

function okModel(s: unknown): s is (typeof PPC_BILLING_MODELS)[number] {
  return typeof s === "string" && (PPC_BILLING_MODELS as readonly string[]).includes(s);
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const profiles = await storage.listPpcBillingProfiles();
    return NextResponse.json({ profiles });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load billing profiles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const row = await storage.createPpcBillingProfile({
      ppcAdAccountId: typeof body.ppcAdAccountId === "number" ? body.ppcAdAccountId : null,
      clientLabel: typeof body.clientLabel === "string" ? body.clientLabel : null,
      billingModel: okModel(body.billingModel) ? body.billingModel : "hybrid",
      setupFeeCents: typeof body.setupFeeCents === "number" ? body.setupFeeCents : null,
      monthlyRetainerCents: typeof body.monthlyRetainerCents === "number" ? body.monthlyRetainerCents : null,
      performanceBonusNotes: typeof body.performanceBonusNotes === "string" ? body.performanceBonusNotes : null,
      laborEstimateHours: typeof body.laborEstimateHours === "number" ? body.laborEstimateHours : null,
      internalProfitabilityScore: typeof body.internalProfitabilityScore === "number" ? body.internalProfitabilityScore : null,
      fulfillmentNotes: typeof body.fulfillmentNotes === "string" ? body.fulfillmentNotes : null,
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
