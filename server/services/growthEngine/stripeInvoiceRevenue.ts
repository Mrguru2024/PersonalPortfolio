/**
 * Idempotent Growth Engine revenue rows from Stripe invoice.paid webhooks.
 */
import type Stripe from "stripe";
import { storage } from "@server/storage";
import { insertGrowthRevenueEvent, findGrowthRevenueEventByStripeInvoiceId } from "./growthEngineStore";

/** `invoice.paid` payloads include these; the Stripe `Invoice` type can omit expand targets. */
type StripeInvoiceWebhook = Stripe.Invoice & {
  payment_intent?: string | Stripe.PaymentIntent | null;
  subscription?: string | Stripe.Subscription | null;
};

function asInvoiceWebhook(invoice: Stripe.Invoice): StripeInvoiceWebhook {
  return invoice as StripeInvoiceWebhook;
}

function stripePaymentIdFromInvoice(invoice: StripeInvoiceWebhook): string | null {
  const pi = invoice.payment_intent;
  if (typeof pi === "string" && pi) return pi;
  if (pi && typeof pi === "object" && pi !== null && "id" in pi && typeof (pi as { id: unknown }).id === "string") {
    return (pi as { id: string }).id;
  }
  return null;
}

function customerIdFromInvoice(invoice: Stripe.Invoice): string | undefined {
  const cust = invoice.customer;
  if (typeof cust === "string") return cust;
  if (cust && typeof cust === "object" && "deleted" in cust && cust.deleted) return undefined;
  if (cust && typeof cust === "object" && "id" in cust && typeof cust.id === "string") return cust.id;
  return undefined;
}

/** Same resolution order as `/api/webhooks/stripe` CRM logging (metadata → email → customer → portal invoice user). */
export async function resolveCrmContactIdForStripeInvoice(invoice: Stripe.Invoice): Promise<number | null> {
  const inv = asInvoiceWebhook(invoice);
  const meta = inv.metadata ?? {};
  if (meta.crmContactId) {
    const n = Number(meta.crmContactId);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const email = inv.customer_email?.trim();
  if (email) {
    const matches = await storage.getCrmContactsByEmails([email]);
    if (matches[0]?.id) return matches[0].id;
  }
  const customerId = customerIdFromInvoice(inv);
  if (customerId) {
    const c = await storage.getCrmContactByStripeCustomerId(customerId);
    if (c?.id) return c.id;
  }
  const stripeInvId = inv.id;
  if (stripeInvId) {
    const dbInv = await storage.getInvoiceByStripeId(stripeInvId);
    if (dbInv?.userId) {
      const user = await storage.getUser(dbInv.userId);
      const uEmail = user?.email?.trim();
      if (uEmail) {
        const rows = await storage.getCrmContactsByNormalizedEmails([uEmail]);
        if (rows[0]?.id) return rows[0].id;
      }
    }
    if (dbInv?.recipientEmail?.trim()) {
      const rows = await storage.getCrmContactsByEmails([dbInv.recipientEmail.trim()]);
      if (rows[0]?.id) return rows[0].id;
    }
  }
  return null;
}

/** Insert one `growth_revenue_events` row per Stripe invoice if not already recorded. */
export async function recordGrowthRevenueFromStripeInvoicePaid(invoice: Stripe.Invoice): Promise<{
  ok: true;
  created: boolean;
  id?: number;
}> {
  const inv = asInvoiceWebhook(invoice);
  const stripeInvId = inv.id;
  if (!stripeInvId) return { ok: true, created: false };

  const existing = await findGrowthRevenueEventByStripeInvoiceId(stripeInvId);
  if (existing) return { ok: true, created: false, id: existing.id };

  const amountPaid =
    typeof inv.amount_paid === "number" ? inv.amount_paid
    : typeof inv.total === "number" ? inv.total
    : 0;
  if (amountPaid <= 0) return { ok: true, created: false };

  const currency = typeof inv.currency === "string" && inv.currency ? inv.currency : "usd";
  const crmContactId = await resolveCrmContactIdForStripeInvoice(invoice);
  const paidAt =
    inv.status_transitions?.paid_at != null ? new Date(inv.status_transitions.paid_at * 1000) : new Date();

  const sub = inv.subscription;
  const subscriptionId =
    typeof sub === "string" ? sub
    : sub && typeof sub === "object" && "id" in sub && typeof (sub as { id: unknown }).id === "string" ?
      (sub as { id: string }).id
    : null;

  const row = await insertGrowthRevenueEvent({
    amountCents: amountPaid,
    currency,
    source: "stripe_invoice",
    stripeInvoiceId: stripeInvId,
    stripePaymentId: stripePaymentIdFromInvoice(inv),
    crmContactId,
    behaviorSessionKey: null,
    pagePath: null,
    funnelSlug: null,
    ctaKey: null,
    formId: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    note: inv.number ? `Stripe invoice #${inv.number}` : "Stripe invoice.paid",
    metadataJson: {
      stripeInvoiceNumber: inv.number ?? null,
      customerEmail: inv.customer_email ?? null,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      subscriptionId,
    },
    recordedAt: paidAt,
    createdByUserId: null,
  });

  return { ok: true, created: true, id: row?.id };
}
