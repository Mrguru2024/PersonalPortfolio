import { NextRequest, NextResponse } from "next/server";
import { db } from "@server/db";
import { projectAssessments } from "@shared/schema";
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

    const [assessment] = await db
      .select()
      .from(projectAssessments)
      .where(eq(projectAssessments.id, id))
      .limit(1);

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      assessment,
    });
  } catch (error: any) {
    console.error("Error fetching assessment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment" },
      { status: 500 }
    );
  }
}
