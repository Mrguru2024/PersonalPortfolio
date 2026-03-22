import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { z } from "zod";
import { computeInvoiceTotals } from "@/lib/invoiceTotals";
import type { InvoiceLineItem } from "@shared/schema";
import { isStripeConfigured, releaseStripeInvoice } from "@server/services/stripeInvoiceService";

const lineItemSchema = z.object({
  description: z.string().min(1),
  amount: z.number().int().nonnegative(),
  quantity: z.number().int().positive().optional(),
  saleType: z.enum(["service", "product"]).optional(),
});

const updateInvoiceSchema = z.object({
  title: z.string().min(1).optional(),
  amount: z.number().int().nonnegative().optional(),
  recipientEmail: z.string().email().optional().nullable(),
  dueDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).nullable(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  lineItems: z.array(lineItemSchema).optional(),
  invoiceSaleType: z.enum(["service", "product", "mixed"]).optional().nullable(),
  taxRatePercent: z.coerce.number().min(0).max(100).optional(),
  saveLineItemsToCatalog: z.boolean().optional(),
});

function defaultTaxRate(): number {
  const raw = process.env.INVOICE_DEFAULT_TAX_PERCENT ?? "0";
  return Math.min(100, Math.max(0, parseFloat(raw) || 0));
}

function normalizeLinesFingerprint(items: InvoiceLineItem[] | null | undefined): string {
  if (!items?.length) return "[]";
  return JSON.stringify(
    items.map((l) => ({
      d: l.description.trim(),
      a: l.amount,
      q: l.quantity ?? 1,
      s: l.saleType ?? null,
    })),
  );
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
    }
    const invoice = await storage.getInvoiceById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
    }
    const existing = await storage.getInvoiceById(id);
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    const body = await req.json();
    const data = updateInvoiceSchema.parse(body);

    const isPaid = existing.status === "paid";
    if (isPaid) {
      const financialInBody =
        data.lineItems != null ||
        data.taxRatePercent !== undefined ||
        data.invoiceSaleType !== undefined ||
        data.amount !== undefined;
      if (financialInBody) {
        return NextResponse.json(
          {
            error:
              "Paid invoices cannot change amounts, line items, or tax. You can update title, recipient email, due date, or status only.",
          },
          { status: 400 },
        );
      }
    }

    let financialChanged = false;
    if (!isPaid) {
      if (
        data.invoiceSaleType !== undefined &&
        (data.invoiceSaleType ?? null) !== (existing.invoiceSaleType ?? null)
      ) {
        financialChanged = true;
      }
      const existingTax =
        typeof existing.taxRatePercent === "number" ? existing.taxRatePercent : defaultTaxRate();
      if (data.taxRatePercent !== undefined && Math.abs(data.taxRatePercent - existingTax) > 1e-6) {
        financialChanged = true;
      }
      if (data.lineItems != null) {
        const mapped: InvoiceLineItem[] =
          data.lineItems.length > 0
            ? data.lineItems.map((l) => ({
                description: l.description.trim(),
                amount: l.amount,
                quantity: l.quantity ?? 1,
                ...(l.saleType ? { saleType: l.saleType } : {}),
              }))
            : [];
        financialChanged =
          financialChanged || normalizeLinesFingerprint(existing.lineItems) !== normalizeLinesFingerprint(mapped);
      }
    }

    const mustDetachStripe = !isPaid && !!existing.stripeInvoiceId && financialChanged;

    if (mustDetachStripe && isStripeConfigured()) {
      try {
        await releaseStripeInvoice(existing.stripeInvoiceId!);
      } catch (e) {
        console.error("[invoice] releaseStripeInvoice", e);
        return NextResponse.json(
          {
            error:
              "Could not release the existing Stripe invoice (void or delete it in Stripe, then try again).",
          },
          { status: 502 },
        );
      }
    }

    const updates: Record<string, unknown> = { ...data };
    if (data.dueDate !== undefined) {
      updates.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    delete updates.saveLineItemsToCatalog;

    if (mustDetachStripe) {
      updates.stripeInvoiceId = null;
      updates.stripeCustomerId = null;
      updates.hostInvoiceUrl = null;
      if (existing.status !== "draft") {
        updates.status = "draft";
      }
    }

    const taxRate =
      data.taxRatePercent ??
      (typeof existing.taxRatePercent === "number" ? existing.taxRatePercent : defaultTaxRate());

    let lineItemsForTotals: InvoiceLineItem[] | null = null;

    if (data.lineItems != null && data.lineItems.length > 0) {
      lineItemsForTotals = data.lineItems.map((l) => ({
        description: l.description.trim(),
        amount: l.amount,
        quantity: l.quantity ?? 1,
        ...(l.saleType ? { saleType: l.saleType } : {}),
      }));
    } else if (data.taxRatePercent !== undefined && existing.lineItems && existing.lineItems.length > 0) {
      lineItemsForTotals = existing.lineItems;
    }

    if (lineItemsForTotals) {
      const { subtotalCents, taxAmountCents, totalCents } = computeInvoiceTotals(lineItemsForTotals, taxRate);
      updates.lineItems = lineItemsForTotals;
      updates.subtotalCents = subtotalCents;
      updates.taxAmountCents = taxAmountCents;
      updates.taxRatePercent = taxRate;
      updates.amount = totalCents;
    }

    if (data.invoiceSaleType !== undefined) {
      updates.invoiceSaleType = data.invoiceSaleType;
    }

    const invoice = await storage.updateInvoice(id, updates as any);

    if (data.saveLineItemsToCatalog && data.lineItems && data.lineItems.length > 0) {
      const saleCtx = data.invoiceSaleType ?? existing.invoiceSaleType ?? undefined;
      for (const l of data.lineItems) {
        const name = l.description.length > 80 ? `${l.description.slice(0, 77)}…` : l.description;
        const presetType = l.saleType ?? (saleCtx === "product" ? "product" : "service");
        await storage
          .createInvoiceLineItemPreset({
            name,
            description: l.description.trim(),
            defaultAmountCents: l.amount,
            defaultQuantity: l.quantity ?? 1,
            saleType: presetType,
          })
          .catch((e) => console.warn("[invoice] save preset skipped", e));
      }
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
    }
    const existing = await storage.getInvoiceById(id);
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (existing.stripeInvoiceId && isStripeConfigured()) {
      try {
        await releaseStripeInvoice(existing.stripeInvoiceId);
      } catch (e) {
        console.error("[invoice] delete releaseStripeInvoice", e);
        return NextResponse.json(
          {
            error:
              "Could not remove the Stripe invoice. Open Stripe, void or delete the invoice, then try deleting here again.",
          },
          { status: 502 },
        );
      }
    }
    await storage.deleteInvoice(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
