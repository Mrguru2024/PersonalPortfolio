import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import {
  createDraftInvoice,
  finalizeAndSendInvoice,
  isStripeConfigured,
} from "@server/services/stripeInvoiceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured. Set STRIPE_SECRET_KEY." },
        { status: 503 }
      );
    }
    const id = Number((await params).id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
    }
    const invoice = await storage.getInvoiceById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (invoice.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft invoices can be sent" },
        { status: 400 }
      );
    }
    const recipientEmail = invoice.recipientEmail;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Recipient email is required to send invoice" },
        { status: 400 }
      );
    }
    const lineItems = invoice.lineItems && invoice.lineItems.length > 0
      ? invoice.lineItems
      : [{ description: invoice.title, amount: invoice.amount, quantity: 1 }];

    let stripeInvoiceId = invoice.stripeInvoiceId;
    let hostInvoiceUrl = invoice.hostInvoiceUrl;
    let stripeCustomerId = invoice.stripeCustomerId;

    if (!stripeInvoiceId) {
      const created = await createDraftInvoice({
        customerEmail: recipientEmail,
        title: invoice.title,
        lineItems,
        dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
        metadata: { invoiceId: String(invoice.id), invoiceNumber: invoice.invoiceNumber },
      });
      stripeInvoiceId = created.stripeInvoiceId;
      stripeCustomerId = created.stripeCustomerId;
      hostInvoiceUrl = created.hostInvoiceUrl;
    }

    const { hostInvoiceUrl: finalUrl, status } = await finalizeAndSendInvoice(stripeInvoiceId);

    const userByEmail = await storage.getUserByEmail(recipientEmail);
    await storage.updateInvoice(id, {
      stripeInvoiceId,
      stripeCustomerId,
      recipientEmail,
      hostInvoiceUrl: finalUrl,
      status: "sent",
      ...(userByEmail && { userId: userByEmail.id }),
    });

    return NextResponse.json({
      success: true,
      hostInvoiceUrl: finalUrl,
      status,
    });
  } catch (error: any) {
    console.error("Error sending invoice:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send invoice" },
      { status: 500 }
    );
  }
}
