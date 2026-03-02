import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { ASSESSMENT_STATUSES } from "@shared/schema";

export const dynamic = "force-dynamic";

async function handleStatusUpdate(
  req: NextRequest,
  params: Promise<{ id: string }>
): Promise<NextResponse> {
  if (!(await isAdmin(req))) {
    return NextResponse.json(
      { message: "Admin access required" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const status = body?.status;
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);

  if (!status || !ASSESSMENT_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${ASSESSMENT_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const updatedAssessment = await storage.updateAssessmentStatus(id, status);
    return NextResponse.json(updatedAssessment);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error updating assessment status:", error);
    if (err?.message === "Assessment not found") {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update assessment status" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return handleStatusUpdate(req, ctx.params);
}

/** POST fallback for environments or proxies that block PATCH (e.g. 405). */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return handleStatusUpdate(req, ctx.params);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { Allow: "PATCH, POST, OPTIONS" } });
}
