import type { InvoiceLineItem } from "@shared/schema";

export type InvoiceSaleType = "service" | "product" | "mixed";

export function computeInvoiceTotals(
  lineItems: Pick<InvoiceLineItem, "amount" | "quantity">[],
  taxRatePercent: number
): { subtotalCents: number; taxAmountCents: number; totalCents: number } {
  const subtotalCents = lineItems.reduce((sum, l) => sum + l.amount * (l.quantity ?? 1), 0);
  const taxAmountCents = Math.round((subtotalCents * taxRatePercent) / 100);
  return {
    subtotalCents,
    taxAmountCents,
    totalCents: subtotalCents + taxAmountCents,
  };
}

/** Prefix line text for Stripe/hosted invoice based on sale type (line overrides invoice when set). */
export function formatInvoiceLineDescription(
  description: string,
  lineSaleType: InvoiceLineItem["saleType"],
  invoiceSaleType: InvoiceSaleType | null | undefined
): string {
  const t =
    lineSaleType ??
    (invoiceSaleType === "service" || invoiceSaleType === "product" ? invoiceSaleType : undefined);
  if (t === "service") return `Service — ${description}`;
  if (t === "product") return `Product — ${description}`;
  return description;
}
