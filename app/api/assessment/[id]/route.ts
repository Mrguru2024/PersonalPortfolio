import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

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

    const assessment = await storage.getAssessmentById(id);

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
