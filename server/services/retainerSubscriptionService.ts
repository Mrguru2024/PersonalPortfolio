import Stripe from "stripe";
import { db } from "@server/db";
import { retainerSubscriptions } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { getOrCreateCustomer } from "./stripeInvoiceService";

function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

export function isStripeRetainerConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_RETAINER_DEFAULT_PRICE_ID?.trim());
}

function defaultRetainerPriceId(): string | undefined {
  return process.env.STRIPE_RETAINER_DEFAULT_PRICE_ID?.trim() || undefined;
}

async function getSubscriptionPrimaryPrice(
  s: Stripe,
  sub: Stripe.Subscription,
): Promise<{ priceId: string; amountCents: number; interval: string }> {
  const item = sub.items?.data?.[0];
  if (!item) throw new Error("Subscription has no items");
  const priceRef = item.price;
  const priceId = typeof priceRef === "string" ? priceRef : priceRef.id;
  if (typeof priceRef === "string") {
    const price = await s.prices.retrieve(priceId);
    return {
      priceId,
      amountCents: price.unit_amount ?? 0,
      interval: price.recurring?.interval ?? "month",
    };
  }
  return {
    priceId,
    amountCents: priceRef.unit_amount ?? 0,
    interval: priceRef.recurring?.interval ?? "month",
  };
}

function subscriptionPeriodEndUnix(sub: Stripe.Subscription): number | null {
  const item = sub.items?.data?.[0];
  if (item && typeof item.current_period_end === "number") return item.current_period_end;
  return null;
}

async function shouldSyncRetainerRow(sub: Stripe.Subscription): Promise<boolean> {
  const [existing] = await db
    .select({ id: retainerSubscriptions.id })
    .from(retainerSubscriptions)
    .where(eq(retainerSubscriptions.stripeSubscriptionId, sub.id))
    .limit(1);
  if (existing) return true;
  const meta = sub.metadata ?? {};
  if (meta.serviceAgreementId || meta.ascendra_retainer === "1") return true;
  const def = defaultRetainerPriceId();
  if (!def) return false;
  try {
    const s = stripe();
    const { priceId } = await getSubscriptionPrimaryPrice(s, sub);
    return priceId === def;
  } catch {
    return false;
  }
}

/**
 * Idempotent — safe for API + webhooks (avoids duplicate rows on subscription.created racing our insert).
 */
export async function upsertRetainerFromStripeSubscription(sub: Stripe.Subscription) {
  if (!(await shouldSyncRetainerRow(sub))) return null;
  const s = stripe();
  const customerId =
    typeof sub.customer === "string" ? sub.customer : (sub.customer as Stripe.Customer | undefined)?.id;
  if (!customerId) return null;

  const { priceId, amountCents, interval } = await getSubscriptionPrimaryPrice(s, sub);

  let clientEmail: string | undefined = sub.metadata?.client_email?.trim();
  let clientName = sub.metadata?.client_name?.trim() || null;
  const cust = await s.customers.retrieve(customerId);
  if (!clientEmail && typeof cust !== "string" && !cust.deleted) {
    const em = cust.email?.trim();
    if (em) clientEmail = em;
    clientName = clientName || cust.name?.trim() || null;
  }
  if (!clientEmail) return null;

  const agRaw = sub.metadata?.serviceAgreementId;
  const agreementIdParsed = agRaw ? Number(agRaw) : NaN;
  const agreementId = Number.isFinite(agreementIdParsed) ? agreementIdParsed : null;

  const periodUnix = subscriptionPeriodEndUnix(sub);
  const periodEnd = periodUnix != null ? new Date(periodUnix * 1000) : null;

  const [row] = await db
    .insert(retainerSubscriptions)
    .values({
      agreementId,
      clientName,
      clientEmail: clientEmail.toLowerCase(),
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      interval,
      amountCents,
      status: sub.status,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      metadataJson: { stripe_status: sub.status },
    })
    .onConflictDoUpdate({
      target: retainerSubscriptions.stripeSubscriptionId,
      set: {
        status: sub.status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
        updatedAt: new Date(),
        stripePriceId: priceId,
        interval,
        amountCents,
        metadataJson: { stripe_status: sub.status },
      },
    })
    .returning();

  return row ?? null;
}

export async function createRetainerSubscription(input: {
  clientEmail: string;
  clientName?: string | null;
  agreementId?: number | null;
  /** Falls back to STRIPE_RETAINER_DEFAULT_PRICE_ID */
  stripePriceId?: string | null;
  quantity?: number;
}) {
  const priceId =
    input.stripePriceId?.trim() || process.env.STRIPE_RETAINER_DEFAULT_PRICE_ID?.trim();
  if (!priceId) throw new Error("stripePriceId or STRIPE_RETAINER_DEFAULT_PRICE_ID required");

  const s = stripe();
  const customerId = await getOrCreateCustomer(
    input.clientEmail.trim().toLowerCase(),
    input.clientName?.trim() || undefined,
  );

  const meta: Record<string, string> = {};
  if (input.agreementId != null) meta.serviceAgreementId = String(input.agreementId);
  meta.ascendra_retainer = "1";
  meta.client_email = input.clientEmail.trim().toLowerCase();
  if (input.clientName?.trim()) meta.client_name = input.clientName.trim();

  const sub = await s.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId, quantity: input.quantity ?? 1 }],
    metadata: meta,
    collection_method: "charge_automatically",
  });

  const row = await upsertRetainerFromStripeSubscription(sub);
  if (!row) throw new Error("Failed to persist retainer subscription row");
  return { subscription: sub, row };
}

export async function syncRetainerFromStripeSubscription(sub: Stripe.Subscription) {
  const row = await upsertRetainerFromStripeSubscription(sub);
  return row?.id ?? null;
}

export async function listRetainerSubscriptionsForAdmin(limit = 100) {
  return db
    .select()
    .from(retainerSubscriptions)
    .orderBy(desc(retainerSubscriptions.createdAt))
    .limit(Math.min(200, limit));
}
