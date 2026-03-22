import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { z } from "zod";
import { computeInvoiceTotals } from "@/lib/invoiceTotals";
import type { InvoiceLineItem } from "@shared/schema";

const lineItemSchema = z.object({
  description: z.string().min(1),
  amount: z.number().int().nonnegative(),
  quantity: z.number().int().positive().optional(),
  saleType: z.enum(["service", "product"]).optional(),
});

const createInvoiceSchema = z.object({
  title: z.string().min(1),
  /** Ignored when lineItems are provided; computed server-side from lines + tax */
  amount: z.number().int().nonnegative().optional(),
  userId: z.number().int().positive().optional(),
  quoteId: z.number().int().positive().optional(),
  recipientEmail: z.string().email().optional(),
  dueDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  lineItems: z.array(lineItemSchema).optional(),
  invoiceSaleType: z.enum(["service", "product", "mixed"]).optional(),
  taxRatePercent: z.coerce.number().min(0).max(100).optional(),
  saveLineItemsToCatalog: z.boolean().optional(),
});

function generateInvoiceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `INV-${date}-${rand}`;
}

function defaultTaxRate(): number {
  const raw = process.env.INVOICE_DEFAULT_TAX_PERCENT ?? "0";
  return Math.min(100, Math.max(0, parseFloat(raw) || 0));
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const invoices = await storage.getAllInvoices();
    return NextResponse.json(invoices);
  } catch (error: unknown) {
    console.error("Error fetching invoices:", error);
    const message = error instanceof Error ? error.message : String(error);
    const isSchemaError =
      /relation ["']?client_invoices["']? does not exist/i.test(message) ||
      /column .* does not exist/i.test(message);
    if (isSchemaError) {
      return NextResponse.json(
        {
          error: "Failed to fetch invoices",
          message:
            "Invoices table is missing or outdated. Run: npm run db:create. If the table exists, run: npx tsx scripts/add-invoice-stripe-columns.ts",
        },
        { status: 503 }
      );
    }
    const details = process.env.NODE_ENV === "development" ? message : undefined;
    return NextResponse.json(
      { error: "Failed to fetch invoices", ...(details && { details }) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const data = createInvoiceSchema.parse(body);

    const taxRate = data.taxRatePercent ?? defaultTaxRate();
    let lineItems: InvoiceLineItem[];

    if (data.lineItems && data.lineItems.length > 0) {
      lineItems = data.lineItems.map((l) => ({
        description: l.description.trim(),
        amount: l.amount,
        quantity: l.quantity ?? 1,
        ...(l.saleType ? { saleType: l.saleType } : {}),
      }));
    } else if (data.amount != null) {
      lineItems = [{ description: data.title.trim(), amount: data.amount, quantity: 1 }];
    } else {
      return NextResponse.json(
        { error: "Provide lineItems or a single amount for a one-line invoice" },
        { status: 400 }
      );
    }

    const { subtotalCents, taxAmountCents, totalCents } = computeInvoiceTotals(lineItems, taxRate);
    const dueDate = data.dueDate ? new Date(data.dueDate) : null;
    const invoiceNumber = generateInvoiceNumber();

    const invoice = await storage.createInvoice({
      invoiceNumber,
      title: data.title.trim(),
      amount: totalCents,
      subtotalCents,
      taxRatePercent: taxRate,
      taxAmountCents,
      invoiceSaleType: data.invoiceSaleType ?? null,
      userId: data.userId ?? null,
      quoteId: data.quoteId ?? null,
      recipientEmail: data.recipientEmail ?? null,
      dueDate,
      status: "draft",
      lineItems,
    });

    if (data.saveLineItemsToCatalog) {
      for (const l of lineItems) {
        const name =
          l.description.length > 80 ? `${l.description.slice(0, 77)}…` : l.description;
        const presetType =
          l.saleType ?? (data.invoiceSaleType === "product" ? "product" : "service");
        await storage
          .createInvoiceLineItemPreset({
            name,
            description: l.description,
            defaultAmountCents: l.amount,
            defaultQuantity: l.quantity ?? 1,
            saleType: presetType,
          })
          .catch((e) => console.warn("[invoice] save preset skipped", e));
      }
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
