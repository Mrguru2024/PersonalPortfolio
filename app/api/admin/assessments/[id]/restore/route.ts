import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/**
 * Restore a soft-deleted assessment so it appears in the list again.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(_req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }
    const { id: idParam } = await params;
    const id = Number.parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid assessment id" }, { status: 400 });
    }
    const assessment = await storage.restoreAssessment(id);
    return NextResponse.json(assessment);
  } catch (error: unknown) {
    console.error("Error restoring assessment:", error);
    if (error instanceof Error && error.message === "Assessment not found") {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to restore assessment" },
      { status: 500 }
    );
  }
}
