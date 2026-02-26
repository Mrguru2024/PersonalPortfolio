import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string(),
  amount: z.number().int().nonnegative(),
  quantity: z.number().int().positive().optional(),
});

const createInvoiceSchema = z.object({
  title: z.string().min(1),
  amount: z.number().int().nonnegative(),
  userId: z.number().int().positive().optional(),
  quoteId: z.number().int().positive().optional(),
  recipientEmail: z.string().email().optional(),
  dueDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  lineItems: z.array(lineItemSchema).optional(),
});

function generateInvoiceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `INV-${date}-${rand}`;
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
    const dueDate = data.dueDate ? new Date(data.dueDate) : null;
    const invoiceNumber = generateInvoiceNumber();
    const invoice = await storage.createInvoice({
      invoiceNumber,
      title: data.title,
      amount: data.amount,
      userId: data.userId ?? null,
      quoteId: data.quoteId ?? null,
      recipientEmail: data.recipientEmail ?? null,
      dueDate,
      status: "draft",
      lineItems: data.lineItems ?? [{ description: data.title, amount: data.amount, quantity: 1 }],
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
