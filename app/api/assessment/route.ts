import { NextRequest, NextResponse } from "next/server";
import { projectAssessmentSchema } from "@shared/assessmentSchema";
import { pricingService } from "@server/services/pricingService";
import { proposalService } from "@server/services/proposalService";
import { db } from "@server/db";
import { projectAssessments } from "@shared/schema";
import { emailService } from "@server/services/emailService";

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
    
    // Send email notification
    await emailService.sendNotification({
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
    
    // Generate proposal automatically (for all budgets)
    let proposal = null;
    try {
      proposal = await proposalService.generateProposal(validatedData, assessment.id);
    } catch (error) {
      console.error("Error generating proposal:", error);
      // Don't fail the request if proposal generation fails
    }

    // Store in response for client-side access
    const response = NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        pricingBreakdown,
        proposalGenerated: !!proposal,
      },
    });

    // Also store in a way the client can access immediately
    // (In production, you might want to use a session or token-based approach)
    
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
