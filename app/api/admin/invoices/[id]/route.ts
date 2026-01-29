import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { z } from "zod";

const updateInvoiceSchema = z.object({
  title: z.string().min(1).optional(),
  amount: z.number().int().nonnegative().optional(),
  recipientEmail: z.string().email().optional().nullable(),
  dueDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).nullable(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  lineItems: z.array(z.object({ description: z.string(), amount: z.number().int(), quantity: z.number().int().optional() })).optional(),
});

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
    const updates: Record<string, unknown> = { ...data };
    if (data.dueDate !== undefined) {
      updates.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    const invoice = await storage.updateInvoice(id, updates as any);
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
    await storage.deleteInvoice(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
