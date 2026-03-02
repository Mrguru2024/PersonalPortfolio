import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { ASSESSMENT_STATUSES } from "@shared/schema";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const { status } = await req.json();
    const { id: idParam } = await params;
    const id = Number.parseInt(idParam, 10);

    if (!status || !ASSESSMENT_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${ASSESSMENT_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const updatedAssessment = await storage.updateAssessmentStatus(id, status);
    return NextResponse.json(updatedAssessment);
  } catch (error: any) {
    console.error("Error updating assessment status:", error);
    if (error?.message === "Assessment not found") {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update assessment status" },
      { status: 500 }
    );
  }
}
