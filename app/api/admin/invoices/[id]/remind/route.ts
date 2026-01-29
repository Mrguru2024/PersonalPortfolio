import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { emailService } from "@server/services/emailService";
import { format } from "date-fns";

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
    const id = Number((await params).id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
    }
    const invoice = await storage.getInvoiceById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    const recipientEmail = invoice.recipientEmail;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Recipient email is required to send reminder" },
        { status: 400 }
      );
    }
    const payUrl = invoice.hostInvoiceUrl;
    if (!payUrl) {
      return NextResponse.json(
        { error: "Invoice has not been sent yet. Send the invoice first." },
        { status: 400 }
      );
    }
    const amountFormatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format((invoice.amount || 0) / 100);

    const dueDateStr = invoice.dueDate
      ? format(new Date(invoice.dueDate), "PPP")
      : undefined;

    const sent = await emailService.sendInvoiceReminder({
      to: recipientEmail,
      invoiceNumber: invoice.invoiceNumber,
      title: invoice.title,
      amountFormatted,
      dueDate: dueDateStr,
      payUrl,
    });

    if (sent) {
      await storage.updateInvoice(id, { lastReminderAt: new Date() });
    }

    return NextResponse.json({
      success: sent,
      message: sent ? "Reminder sent" : "Failed to send reminder email",
    });
  } catch (error: any) {
    console.error("Error sending reminder:", error);
    return NextResponse.json(
      { error: "Failed to send reminder" },
      { status: 500 }
    );
  }
}
