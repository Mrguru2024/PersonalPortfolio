import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";

/** GET /api/proposal/view/[token] - Public view of a proposal by secure token (read-only). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "Invalid link" }, { status: 400 });
    }

    const quote = await storage.getClientQuoteByViewToken(token);
    if (!quote) {
      return NextResponse.json({ error: "Proposal not found or link has expired" }, { status: 404 });
    }

    const validUntil = quote.validUntil ? new Date(quote.validUntil) : null;
    if (validUntil && validUntil < new Date()) {
      return NextResponse.json({ error: "This proposal link has expired" }, { status: 410 });
    }

    return NextResponse.json({
      quoteId: quote.id,
      title: quote.title,
      totalAmount: quote.totalAmount,
      status: quote.status,
      validUntil: quote.validUntil,
      proposalData: quote.proposalData,
      canApprove: quote.status === "sent" || quote.status === "pending",
    });
  } catch (error: any) {
    console.error("Proposal view by token error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load proposal" },
      { status: 500 }
    );
  }
}
