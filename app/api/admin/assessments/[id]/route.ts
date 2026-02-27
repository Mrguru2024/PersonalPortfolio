import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(
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
    const assessment = await storage.getAssessmentById(id);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }
    return NextResponse.json(assessment);
  } catch (error: unknown) {
    console.error("Error fetching assessment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    await storage.deleteAssessment(id);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    console.error("Error deleting assessment:", error);
    if (error instanceof Error && error.message === "Assessment not found") {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("foreign key") || msg.includes("violates foreign key constraint")) {
      return NextResponse.json(
        { error: "Cannot delete: assessment has linked quotes or feedback. Remove those first." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete assessment" },
      { status: 500 }
    );
  }
}
