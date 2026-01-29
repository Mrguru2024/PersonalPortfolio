import Stripe from "stripe";
import type { InvoiceLineItem } from "@shared/schema";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  stripe ??= new Stripe(stripeSecretKey);
  return stripe;
}

export interface CreateInvoiceParams {
  customerEmail: string;
  customerName?: string;
  title: string;
  lineItems: InvoiceLineItem[];
  dueDate?: Date;
  metadata?: { invoiceId?: string; invoiceNumber?: string };
}

/** Create or retrieve Stripe customer by email */
export async function getOrCreateCustomer(
  email: string,
  name?: string
): Promise<string> {
  const s = getStripe();
  const existing = await s.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) {
    return existing.data[0].id;
  }
  const customer = await s.customers.create({
    email,
    name: name || undefined,
  });
  return customer.id;
}

/** Create a draft invoice in Stripe, add line items, return invoice id and hosted URL (after finalize) */
export async function createDraftInvoice(
  params: CreateInvoiceParams
): Promise<{
  stripeInvoiceId: string;
  stripeCustomerId: string;
  hostInvoiceUrl: string | null;
}> {
  const s = getStripe();
  const customerId = await getOrCreateCustomer(
    params.customerEmail,
    params.customerName
  );

  const invoice = await s.invoices.create({
    customer: customerId,
    collection_method: "send_invoice",
    days_until_due: params.dueDate
      ? Math.ceil((params.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : 30,
    metadata: {
      ...(params.metadata?.invoiceId && { invoiceId: String(params.metadata.invoiceId) }),
      ...(params.metadata?.invoiceNumber && { invoiceNumber: params.metadata.invoiceNumber }),
    },
    custom_fields: params.title ? [{ name: "Project", value: params.title }] : undefined,
  });

  for (const item of params.lineItems) {
    await s.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      description: item.description,
      amount: item.amount,
      quantity: item.quantity ?? 1,
    });
  }

  return {
    stripeInvoiceId: invoice.id,
    stripeCustomerId: customerId,
    hostInvoiceUrl: invoice.hosted_invoice_url || null,
  };
}

/** Finalize and send the invoice; Stripe will email the customer with the hosted link */
export async function finalizeAndSendInvoice(stripeInvoiceId: string): Promise<{
  hostInvoiceUrl: string;
  status: string;
}> {
  const s = getStripe();
  const invoice = await s.invoices.finalizeInvoice(stripeInvoiceId);
  await s.invoices.sendInvoice(stripeInvoiceId);
  return {
    hostInvoiceUrl: invoice.hosted_invoice_url || "",
    status: invoice.status || "open",
  };
}

/** Get hosted invoice URL for an existing invoice */
export async function getHostedInvoiceUrl(stripeInvoiceId: string): Promise<string | null> {
  const s = getStripe();
  const invoice = await s.invoices.retrieve(stripeInvoiceId);
  return invoice.hosted_invoice_url || null;
}

/** Void/cancel a draft invoice */
export async function voidInvoice(stripeInvoiceId: string): Promise<void> {
  const s = getStripe();
  await s.invoices.voidInvoice(stripeInvoiceId);
}

/** Check if Stripe is configured */
export function isStripeConfigured(): boolean {
  return !!stripeSecretKey;
}
