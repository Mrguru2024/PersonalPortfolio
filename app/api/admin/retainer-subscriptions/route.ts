import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  createRetainerSubscription,
  isStripeRetainerConfigured,
  listRetainerSubscriptionsForAdmin,
} from "@server/services/retainerSubscriptionService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  try {
    const retainers = await listRetainerSubscriptionsForAdmin(100);
    return NextResponse.json({ retainers });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  if (!isStripeRetainerConfigured()) {
    return NextResponse.json({ error: "stripe_retainer_not_configured" }, { status: 503 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const clientEmail = String(body.clientEmail ?? "").trim();
    if (!clientEmail) {
      return NextResponse.json({ error: "clientEmail required" }, { status: 400 });
    }
    const agreementIdRaw = body.agreementId;
    const agreementId =
      agreementIdRaw != null && String(agreementIdRaw).trim() !== "" ?
        Number(agreementIdRaw)
      : null;
    const bundle = await createRetainerSubscription({
      clientEmail,
      clientName: body.clientName != null ? String(body.clientName) : null,
      agreementId: Number.isFinite(agreementId as number) ? (agreementId as number) : null,
      stripePriceId: body.stripePriceId != null ? String(body.stripePriceId) : null,
      quantity: body.quantity != null ? Number(body.quantity) : undefined,
    });
    return NextResponse.json({
      stripeSubscriptionId: bundle.subscription.id,
      status: bundle.subscription.status,
      row: bundle.row,
    });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
