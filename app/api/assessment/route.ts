import { NextRequest, NextResponse } from "next/server";
import { projectAssessmentSchema } from "@shared/assessmentSchema";
import { pricingService } from "@server/services/pricingService";
import { proposalService } from "@server/services/proposalService";
import { db } from "@server/db";
import { projectAssessments, clientQuotes } from "@shared/schema";
import { emailService } from "@server/services/emailService";
import { storage } from "@server/storage";
import { getSessionUser } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate assessment data
    const validatedData = projectAssessmentSchema.parse(body);
    
    // Calculate pricing
    const pricingBreakdown = pricingService.calculatePricing(validatedData);
    
    // Save to database
    const [assessment] = await db.insert(projectAssessments).values({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone || null,
      company: validatedData.company || null,
      role: validatedData.role || null,
      assessmentData: validatedData,
      pricingBreakdown: pricingBreakdown,
      status: 'pending',
    }).returning();
    console.log(
      `[Assessment form] Saved id=${assessment.id} email=${assessment.email} name=${assessment.name}`
    );

    // Send email notification to admin
    const emailSent = await emailService.sendNotification({
      type: 'quote',
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || '',
        company: validatedData.company || '',
        projectType: validatedData.projectType,
        budget: `$${pricingBreakdown.estimatedRange.min.toLocaleString()} - $${pricingBreakdown.estimatedRange.max.toLocaleString()}`,
        timeframe: validatedData.preferredTimeline || 'flexible',
        message: `Project Assessment Completed\n\nProject: ${validatedData.projectName}\nType: ${validatedData.projectType}\n\nA professional proposal with detailed cost breakdown, timeline, and project scope has been generated and is available on the assessment results page.\n\nEstimated Range: $${pricingBreakdown.estimatedRange.min.toLocaleString()} - $${pricingBreakdown.estimatedRange.max.toLocaleString()}\n\nDescription: ${validatedData.projectDescription}\n\nView your proposal: https://mrguru.dev/assessment/results?id=${assessment.id}`,
        newsletter: validatedData.newsletter || false,
      }
    });
    if (!emailSent) {
      console.warn(
        "[Assessment form] Email notification was not sent. Set BREVO_API_KEY and ADMIN_EMAIL in .env.local (or production env) to receive form notifications."
      );
    }

    // Generate proposal automatically (for all budgets)
    let proposal = null;
    try {
      proposal = await proposalService.generateProposal(validatedData, assessment.id);
    } catch (error) {
      console.error("Error generating proposal:", error);
      // Don't fail the request if proposal generation fails
    }

    // Try to link assessment to user if they're logged in
    let userId: number | null = null;
    try {
      const user = await getSessionUser(req);
      if (user) {
        userId = user.id;
      } else {
        // Try to find user by email
        const userByEmail = await storage.getUserByEmail(validatedData.email);
        if (userByEmail) {
          userId = userByEmail.id;
        }
      }
    } catch (error) {
      // User might not be logged in, that's okay
      console.log("No user found for assessment, quote will be created without user link");
    }

    // Create quote from assessment if proposal was generated
    let quote = null;
    if (proposal) {
      try {
        const quoteNumber = `QT-${Date.now()}-${assessment.id}`;
        const finalTotal = proposal.pricing.finalTotal;
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30); // Valid for 30 days

        const [createdQuote] = await db.insert(clientQuotes).values({
          assessmentId: assessment.id,
          userId: userId || null,
          quoteNumber,
          title: `Quote for ${validatedData.projectName}`,
          proposalData: proposal,
          totalAmount: finalTotal,
          status: 'pending',
          validUntil,
        }).returning();
        
        quote = createdQuote;
      } catch (error) {
        console.error("Error creating quote:", error);
        // Don't fail the request if quote creation fails
      }
    }

    // Store in response for client-side access
    const response = NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        pricingBreakdown,
        proposalGenerated: !!proposal,
        quoteId: quote?.id,
        requiresAccount: !userId,
      },
    });
    
    return response;
  } catch (error: any) {
    console.error("Error processing assessment:", error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to process assessment" },
      { status: 500 }
    );
  }
}
