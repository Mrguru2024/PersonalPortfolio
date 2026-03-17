import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { createDiscoveryWorkspace } from "@server/services/crm/discoveryWorkspaceService";
import { getSessionUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/discovery?contactId=1 or ?dealId=1 — list discovery workspaces for contact or deal. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const dealId = searchParams.get("dealId");
    if (contactId) {
      const id = Number(contactId);
      if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid contactId" }, { status: 400 });
      const list = await storage.getCrmDiscoveryWorkspacesByContactId(id);
      return NextResponse.json({ workspaces: list });
    }
    if (dealId) {
      const id = Number(dealId);
      if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid dealId" }, { status: 400 });
      const list = await storage.getCrmDiscoveryWorkspacesByDealId(id);
      return NextResponse.json({ workspaces: list });
    }
    return NextResponse.json({ error: "contactId or dealId required" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Discovery GET error:", error);
    return NextResponse.json({ error: "Failed to load discovery workspaces" }, { status: 500 });
  }
}

/** POST /api/admin/crm/discovery — create discovery workspace. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const contactId = body.contactId != null ? Number(body.contactId) : undefined;
    const dealId = body.dealId != null ? Number(body.dealId) : undefined;
    const accountId = body.accountId != null ? Number(body.accountId) : undefined;
    if (!contactId || !Number.isFinite(contactId)) {
      return NextResponse.json({ error: "contactId required" }, { status: 400 });
    }
    const contact = await storage.getCrmContactById(contactId);
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const user = await getSessionUser(req);
    const createdByUserId = user?.id != null ? Number(user.id) : undefined;

    const workspace = await createDiscoveryWorkspace(
      storage,
      {
        contactId,
        dealId: Number.isFinite(dealId) ? dealId! : null,
        accountId: Number.isFinite(accountId) ? accountId! : null,
        title: typeof body.title === "string" ? body.title : "Discovery call",
        status: body.status ?? "draft",
        callDate: body.callDate ? new Date(body.callDate) : null,
        meetingType: body.meetingType ?? null,
        attendedBy: body.attendedBy ?? null,
        preparednessScore: body.preparednessScore != null ? Number(body.preparednessScore) : null,
        fitAssessment: body.fitAssessment ?? null,
        readinessAssessment: body.readinessAssessment ?? null,
        summary: body.summary ?? null,
        riskSummary: body.riskSummary ?? null,
        recommendedOfferDirection: body.recommendedOfferDirection ?? null,
        nextStepRecommendation: body.nextStepRecommendation ?? null,
        createdByUserId: createdByUserId ?? null,
        notesSections: body.notesSections ?? null,
        outcome: body.outcome ?? null,
      },
      { createdByUserId }
    );
    return NextResponse.json(workspace);
  } catch (error: unknown) {
    console.error("Discovery POST error:", error);
    return NextResponse.json({ error: "Failed to create discovery workspace" }, { status: 500 });
  }
}
