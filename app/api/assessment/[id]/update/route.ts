import { NextRequest, NextResponse } from "next/server";
import { db } from "@server/db";
import { projectAssessments } from "@shared/schema";
import { pricingService } from "@server/services/pricingService";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessmentId = parseInt(id);
    const body = await req.json();

    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { error: "Invalid assessment ID" },
        { status: 400 }
      );
    }

    // Fetch existing assessment
    const [existingAssessment] = await db
      .select()
      .from(projectAssessments)
      .where(eq(projectAssessments.id, assessmentId))
      .limit(1);

    if (!existingAssessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Update assessment data
    const updatedAssessmentData = {
      ...existingAssessment.assessmentData,
      ...body,
    };

    // Recalculate pricing with updated data
    const pricingBreakdown = pricingService.calculatePricing(updatedAssessmentData as any);

    // Update in database
    const [updatedAssessment] = await db
      .update(projectAssessments)
      .set({
        assessmentData: updatedAssessmentData,
        pricingBreakdown: pricingBreakdown,
      })
      .where(eq(projectAssessments.id, assessmentId))
      .returning();

    return NextResponse.json({
      success: true,
      assessment: {
        ...updatedAssessment,
        pricingBreakdown,
      },
    });
  } catch (error: any) {
    console.error("Error updating assessment:", error);
    return NextResponse.json(
      { error: "Failed to update assessment", details: error.message },
      { status: 500 }
    );
  }
}
