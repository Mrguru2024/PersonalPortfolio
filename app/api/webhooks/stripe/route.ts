import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

async function mergeContactCustomFields(
  contactId: number,
  patch: Record<string, unknown>
): Promise<void> {
  const contact = await storage.getCrmContactById(contactId);
  if (!contact) return;
  const prev = (contact.customFields as Record<string, unknown> | null) ?? {};
  await storage.updateCrmContact(contactId, {
    customFields: { ...prev, ...patch },
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig ?? "", secret);
  } catch (e) {
    console.error("[stripe webhook] signature", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeInvId = invoice.id;
      if (stripeInvId) {
        const dbInv = await storage.getInvoiceByStripeId(stripeInvId);
        if (dbInv && dbInv.status !== "paid") {
          await storage.updateInvoice(dbInv.id, { status: "paid", paidAt: new Date() });
        }
      }

      let contactId: number | undefined;
      const meta = invoice.metadata ?? {};
      if (meta.crmContactId) {
        const n = Number(meta.crmContactId);
        if (Number.isFinite(n)) contactId = n;
      }
      if (contactId == null && invoice.customer_email) {
        const matches = await storage.getCrmContactsByEmails([invoice.customer_email]);
        contactId = matches[0]?.id;
      }
      const cust = invoice.customer;
      const customerId =
        typeof cust === "string" ? cust : cust && typeof cust === "object" && "id" in cust ? String(cust.id) : undefined;
      if (contactId == null && customerId) {
        const c = await storage.getCrmContactByStripeCustomerId(customerId);
        contactId = c?.id;
      }

      if (contactId != null) {
        const contact = await storage.getCrmContactById(contactId);
        await logActivity(storage, {
          contactId,
          accountId: contact?.accountId ?? undefined,
          type: "revenue_ops_payment_completed",
          title: "Payment completed (Stripe)",
          content: invoice.amount_paid != null ? `Paid ${invoice.currency} ${invoice.amount_paid}` : undefined,
          metadata: {
            stripeInvoiceId: invoice.id,
            hostedInvoiceUrl: invoice.hosted_invoice_url,
            amountPaidCents: typeof invoice.amount_paid === "number" ? invoice.amount_paid : 0,
            currency: typeof invoice.currency === "string" ? invoice.currency : "usd",
          },
        });
        await mergeContactCustomFields(contactId, {
          revenueOps: {
            lastStripePaymentAt: new Date().toISOString(),
            lastStripeInvoiceId: invoice.id,
          },
        });
        if (contact && contact.status === "new") {
          await storage.updateCrmContact(contactId, { status: "contacted", lastContactedAt: new Date() });
        }
      }
    }
  } catch (e) {
    console.error("[stripe webhook] handler", e);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
