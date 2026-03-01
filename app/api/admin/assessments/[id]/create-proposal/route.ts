import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { projectAssessments } from "@shared/schema";
import { proposalService } from "@server/services/proposalService";
import { storage } from "@server/storage";
import { emailService } from "@server/services/emailService";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const adminOk = await isAdmin(req);
    if (!adminOk) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const assessmentId = parseInt(id, 10);
    if (isNaN(assessmentId)) {
      return NextResponse.json({ error: "Invalid assessment ID" }, { status: 400 });
    }

    const [assessment] = await db
      .select()
      .from(projectAssessments)
      .where(eq(projectAssessments.id, assessmentId))
      .limit(1);

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const proposal = await proposalService.generateProposal(
      assessment.assessmentData as any,
      assessmentId
    );

    const quoteNumber = `QT-${Date.now()}-${assessmentId}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    const viewToken = crypto.randomBytes(24).toString("hex");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) || req.nextUrl?.origin || "http://localhost:3000";
    const viewUrl = `${baseUrl}/proposal/view/${viewToken}`;

    const quote = await storage.createClientQuote({
      assessmentId: assessment.id,
      userId: null,
      quoteNumber,
      title: proposal.title,
      proposalData: proposal as any,
      totalAmount: proposal.pricing.finalTotal,
      status: "sent",
      validUntil,
      viewToken,
    });

    // Email client with view link and next steps (professional proposal workflow)
    const clientEmail = assessment.email?.trim() || proposal.clientEmail;
    if (clientEmail) {
      await emailService.sendProposalToClient({
        to: clientEmail,
        clientName: assessment.name || proposal.clientName,
        projectName: proposal.projectOverview?.projectName || (assessment.assessmentData as any)?.projectName || "your project",
        viewUrl,
      });
    }

    return NextResponse.json({
      success: true,
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      viewToken,
      viewUrl,
      emailSent: !!clientEmail,
      message: "Proposal created. " + (clientEmail ? "Client has been emailed the view link and next steps." : "Share the view link or have the client sign in at /dashboard to see their proposals."),
    });
  } catch (error: any) {
    console.error("Create proposal error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create proposal" },
      { status: 500 }
    );
  }
}
