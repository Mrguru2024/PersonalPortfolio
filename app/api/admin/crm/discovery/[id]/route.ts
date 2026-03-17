import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { updateDiscoveryWorkspace } from "@server/services/crm/discoveryWorkspaceService";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/discovery/[id] — get one discovery workspace. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const workspace = await storage.getCrmDiscoveryWorkspaceById(id);
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(workspace);
  } catch (error: unknown) {
    console.error("Discovery [id] GET error:", error);
    return NextResponse.json({ error: "Failed to load discovery workspace" }, { status: 500 });
  }
}

/** PATCH /api/admin/crm/discovery/[id] — update discovery workspace. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const existing = await storage.getCrmDiscoveryWorkspaceById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const user = await getSessionUser(req);
    const createdByUserId = user?.id != null ? Number(user.id) : undefined;

    const updates: Record<string, unknown> = {};
    const allowed = [
      "title", "status", "callDate", "meetingType", "attendedBy",
      "preparednessScore", "fitAssessment", "readinessAssessment",
      "summary", "riskSummary", "recommendedOfferDirection", "nextStepRecommendation",
      "notesSections", "outcome",
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (body.callDate !== undefined) updates.callDate = body.callDate ? new Date(body.callDate) : null;

    const workspace = await updateDiscoveryWorkspace(storage, id, updates as any, { createdByUserId });
    return NextResponse.json(workspace);
  } catch (error: unknown) {
    console.error("Discovery [id] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update discovery workspace" }, { status: 500 });
  }
}
