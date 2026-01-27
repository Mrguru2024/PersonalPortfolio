import { NextRequest, NextResponse } from "next/server";
import { db } from "@server/db";
import { projectAssessments } from "@shared/schema";
import { proposalService } from "@server/services/proposalService";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessmentId = parseInt(id);

    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { error: "Invalid assessment ID" },
        { status: 400 }
      );
    }

    // Fetch assessment from database
    const [assessment] = await db
      .select()
      .from(projectAssessments)
      .where(eq(projectAssessments.id, assessmentId))
      .limit(1);

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Generate project suggestions
    const suggestions = await proposalService.generateProjectSuggestions(
      assessment.assessmentData as any
    );

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions", details: error.message },
      { status: 500 }
    );
  }
}
