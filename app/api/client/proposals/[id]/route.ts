import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { emailService } from "@server/services/emailService";
import {
  createDraftInvoice,
  finalizeAndSendInvoice,
  isStripeConfigured,
} from "@server/services/stripeInvoiceService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in to view this proposal" }, { status: 401 });
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid proposal ID" }, { status: 400 });
    }

    let quote = await storage.getClientQuoteById(id, user.id);
    if (!quote && user.email) {
      quote = await storage.getClientQuoteByIdForEmail(id, user.email) ?? undefined;
    }
    if (!quote) {
      return NextResponse.json({ error: "Proposal not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error: any) {
    console.error("Client proposal get error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load proposal" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in to approve or reject this proposal" }, { status: 401 });
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid proposal ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const status = body.status === "accepted" || body.status === "rejected" ? body.status : null;
    if (!status) {
      return NextResponse.json(
        { error: "Body must include status: 'accepted' or 'rejected'" },
        { status: 400 }
      );
    }

    const paymentPlan = body.paymentPlan === "30-30-40" || body.paymentPlan === "50-25-25" ? body.paymentPlan : null;
    if (status === "accepted" && !paymentPlan) {
      return NextResponse.json(
        { error: "When accepting, include paymentPlan: '30-30-40' (30%, 30%, 40%) or '50-25-25' (50%, 25%, 25%)" },
        { status: 400 }
      );
    }

    let updated;
    const byUserId = await storage.getClientQuoteById(id, user.id);
    if (byUserId) {
      updated = await storage.updateClientQuoteStatus(id, user.id, status, paymentPlan ?? undefined);
    } else if (user.email) {
      updated = await storage.updateClientQuoteStatusByEmail(id, user.email, status, paymentPlan ?? undefined);
    } else {
      return NextResponse.json({ error: "Proposal not found or access denied" }, { status: 404 });
    }

    const pd = updated.proposalData as { clientName?: string; clientEmail?: string; projectOverview?: { projectName?: string } } | null;
    const clientName = pd?.clientName || user.username || "Client";
    const clientEmail = pd?.clientEmail || user.email || "";
    const projectName = pd?.projectOverview?.projectName || updated.title || "Project";

    // Approval workflow: notify admin and client, then create and send deposit invoice
    if (status === "accepted" && updated) {
      if (clientEmail) {
        await emailService.sendProposalAcceptedToAdmin({ clientName, clientEmail, projectName });
        await emailService.sendProposalAcceptedToClient({ to: clientEmail, clientName, projectName });
      }

      // Create deposit invoice (first installment: 30% or 50%)
      const totalDollars = Number(updated.totalAmount);
      const depositPercent = paymentPlan === "50-25-25" ? 0.5 : 0.3;
      const depositCents = Math.round(totalDollars * 100 * depositPercent);
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${id}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const invoice = await storage.createInvoice({
        quoteId: updated.id,
        userId: user.id,
        invoiceNumber,
        title: `Deposit – ${projectName}`,
        amount: depositCents,
        status: "draft",
        recipientEmail: clientEmail || undefined,
        dueDate,
        lineItems: [
          {
            description: `Deposit (${Math.round(depositPercent * 100)}% of total) – ${projectName}`,
            amount: depositCents,
            quantity: 1,
          },
        ],
      });

      let payUrl: string | null = null;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
      const dashboardUrl = baseUrl ? `${baseUrl}/dashboard` : "/dashboard";

      if (isStripeConfigured() && (clientEmail || invoice.recipientEmail)) {
        try {
          const recipient = clientEmail || invoice.recipientEmail!;
          const created = await createDraftInvoice({
            customerEmail: recipient,
            customerName: clientName,
            title: invoice.title,
            lineItems: invoice.lineItems && invoice.lineItems.length > 0
              ? invoice.lineItems.map((i) => ({ description: i.description, amount: i.amount, quantity: i.quantity ?? 1 }))
              : [{ description: invoice.title, amount: depositCents, quantity: 1 }],
            dueDate,
            metadata: { invoiceId: String(invoice.id), invoiceNumber: invoice.invoiceNumber },
          });
          const { hostInvoiceUrl } = await finalizeAndSendInvoice(created.stripeInvoiceId);
          await storage.updateInvoice(invoice.id, {
            stripeInvoiceId: created.stripeInvoiceId,
            stripeCustomerId: created.stripeCustomerId,
            hostInvoiceUrl: hostInvoiceUrl,
            recipientEmail: recipient,
            status: "sent",
          });
          payUrl = hostInvoiceUrl;
        } catch (stripeErr: any) {
          console.error("Stripe deposit invoice error:", stripeErr?.message ?? stripeErr);
        }
      }

      if (!payUrl) payUrl = dashboardUrl;

      const amountFormatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(depositCents / 100);
      if (clientEmail) {
        await emailService.sendDepositInvoiceToClient({
          to: clientEmail,
          clientName,
          projectName,
          amountFormatted,
          payUrl,
          invoiceNumber: invoice.invoiceNumber,
        });
      }

      return NextResponse.json({
        success: true,
        status: updated.status,
        message: "Proposal accepted. Your deposit invoice has been sent by email and is available in your dashboard.",
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          title: invoice.title,
          amount: invoice.amount,
          amountFormatted,
          status: invoice.status,
        },
        invoiceUrl: payUrl,
      });
    }

    return NextResponse.json({
      success: true,
      status: updated.status,
      message: status === "accepted" ? "Proposal accepted." : "Proposal declined.",
    });
  } catch (error: any) {
    console.error("Client proposal update error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update proposal" },
      { status: 500 }
    );
  }
}
