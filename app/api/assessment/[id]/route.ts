import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { db } from "@server/db";
import { projectAssessments, type ProjectAssessment } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid assessment ID" },
        { status: 400 }
      );
    }

    let assessment: ProjectAssessment | undefined;
    try {
      assessment = await storage.getAssessmentById(id);
    } catch {
      assessment = undefined;
    }
    // Fallback: load by id without deleted_at so it works in prod when column is missing
    if (!assessment) {
      const [row] = await db
        .select({
          id: projectAssessments.id,
          name: projectAssessments.name,
          email: projectAssessments.email,
          phone: projectAssessments.phone,
          company: projectAssessments.company,
          role: projectAssessments.role,
          assessmentData: projectAssessments.assessmentData,
          pricingBreakdown: projectAssessments.pricingBreakdown,
          status: projectAssessments.status,
          createdAt: projectAssessments.createdAt,
          updatedAt: projectAssessments.updatedAt,
        })
        .from(projectAssessments)
        .where(eq(projectAssessments.id, id))
        .limit(1);
      assessment = row ? ({ ...row, deletedAt: null } as ProjectAssessment) : undefined;
    }

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Check if user is logged in or if user exists with this email
    const user = await getSessionUser(req);
    let userId: number | null = null;
    let requiresAccount = false;

    if (user) {
      userId = user.id;
    } else {
      const userByEmail = await storage.getUserByEmail(assessment.email);
      if (userByEmail) {
        userId = userByEmail.id;
      } else {
        requiresAccount = true;
      }
    }

    return NextResponse.json({
      success: true,
      assessment,
      requiresAccount,
    });
  } catch (error: unknown) {
    console.error("Error fetching assessment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment" },
      { status: 500 }
    );
  }
}
