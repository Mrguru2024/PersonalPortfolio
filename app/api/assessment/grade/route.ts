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
    const score = Math.min(100, Math.max(0, Number(result.score) ?? 50));
    const summary = typeof result.summary === "string" ? result.summary.slice(0, 500) : "Assessment received. Review the breakdown and reach out to discuss.";
    const strengths = Array.isArray(result.strengths) ? result.strengths.slice(0, 4).map(String) : [];
    const improvements = Array.isArray(result.improvements) ? result.improvements.slice(0, 4).map(String) : [];
    return NextResponse.json({ score, summary, strengths, improvements });
  } catch (error: any) {
    console.error("Assessment grade error:", error);
    return NextResponse.json(
      { error: "Failed to grade assessment" },
      { status: 500 }
    );
  }
}
