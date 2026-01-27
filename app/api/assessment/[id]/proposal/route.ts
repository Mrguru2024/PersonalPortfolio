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

    // Generate proposal
    const proposal = await proposalService.generateProposal(
      assessment.assessmentData as any,
      assessmentId
    );

    return NextResponse.json({
      success: true,
      proposal,
    });
  } catch (error: any) {
    console.error("Error generating proposal:", error);
    return NextResponse.json(
      { error: "Failed to generate proposal", details: error.message },
      { status: 500 }
    );
  }
}
