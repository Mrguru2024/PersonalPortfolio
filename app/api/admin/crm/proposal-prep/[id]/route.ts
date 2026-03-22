import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { updateProposalPrepWorkspace } from "@server/services/crm/proposalPrepService";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/proposal-prep/[id] — get one proposal prep workspace. */
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
    const workspace = await storage.getCrmProposalPrepWorkspaceById(id);
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(workspace);
  } catch (error: unknown) {
    console.error("Proposal prep [id] GET error:", error);
    return NextResponse.json({ error: "Failed to load proposal prep workspace" }, { status: 500 });
  }
}

/** PATCH /api/admin/crm/proposal-prep/[id] — update proposal prep workspace. */
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
    const existing = await storage.getCrmProposalPrepWorkspaceById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const user = await getSessionUser(req);
    const createdByUserId = user?.id != null ? Number(user.id) : undefined;

    const updates: Record<string, unknown> = {};
    const allowed = [
      "status", "offerDirection", "scopeSummary", "deliverablesDraft",
      "assumptions", "exclusions", "pricingNotes", "timelineNotes",
      "risks", "dependencies", "crossSellOpportunities", "decisionFactors",
      "proposalReadinessScore", "aiSummary", "checklist", "playbookId",
      "profitabilityInputsJson",
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const workspace = await updateProposalPrepWorkspace(storage, id, updates as any, { createdByUserId });
    return NextResponse.json(workspace);
  } catch (error: unknown) {
    console.error("Proposal prep [id] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update proposal prep workspace" }, { status: 500 });
  }
}
