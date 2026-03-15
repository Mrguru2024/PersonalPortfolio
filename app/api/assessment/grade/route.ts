import { NextRequest, NextResponse } from "next/server";
import { aiAssistanceService } from "@server/services/aiAssistanceService";

export const dynamic = "force-dynamic";

/**
 * POST /api/assessment/grade
 * Returns AI-generated grade (0–100), summary, strengths, and improvements for assessment data.
 * Used for accurate, consistent feedback on completeness and clarity.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const assessmentData = body.assessmentData ?? body;
    if (!assessmentData || typeof assessmentData !== "object") {
      return NextResponse.json({ error: "assessmentData required" }, { status: 400 });
    }
    const result = await aiAssistanceService.gradeAssessment(assessmentData);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Assessment grade error:", error);
    return NextResponse.json(
      { error: "Failed to grade assessment" },
      { status: 500 }
    );
  }
}
