import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    const id = parseInt(params.id);

    if (!status || !["pending", "reviewed", "contacted", "archived"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: pending, reviewed, contacted, or archived" },
        { status: 400 }
      );
    }

    const updatedAssessment = await storage.updateAssessmentStatus(id, status);
    return NextResponse.json(updatedAssessment);
  } catch (error: any) {
    console.error("Error updating assessment status:", error);
    return NextResponse.json(
      { error: "Failed to update assessment status" },
      { status: 500 }
    );
  }
}
