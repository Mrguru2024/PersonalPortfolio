import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { createProposalPrepWorkspace } from "@server/services/crm/proposalPrepService";
import { getSessionUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/proposal-prep?contactId=1 or ?dealId=1 — list proposal prep workspaces. */
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
      const list = await storage.getCrmProposalPrepWorkspacesByContactId(id);
      return NextResponse.json({ workspaces: list });
    }
    if (dealId) {
      const id = Number(dealId);
      if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid dealId" }, { status: 400 });
      const list = await storage.getCrmProposalPrepWorkspacesByDealId(id);
      return NextResponse.json({ workspaces: list });
    }
    return NextResponse.json({ error: "contactId or dealId required" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Proposal prep GET error:", error);
    return NextResponse.json({ error: "Failed to load proposal prep workspaces" }, { status: 500 });
  }
}

/** POST /api/admin/crm/proposal-prep — create proposal prep workspace. */
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

    const defaultChecklist = [
      { id: "url", label: "Website URL reviewed", done: false },
      { id: "goals", label: "Business goals confirmed", done: false },
      { id: "budget", label: "Budget discussed", done: false },
      { id: "timeline", label: "Timeline discussed", done: false },
      { id: "dm", label: "Decision-maker confirmed", done: false },
      { id: "fit", label: "Service fit confirmed", done: false },
      { id: "scope", label: "Scope assumptions reviewed", done: false },
      { id: "risks", label: "Risks noted", done: false },
      { id: "followup", label: "Follow-up items resolved", done: false },
    ];

    const workspace = await createProposalPrepWorkspace(
      storage,
      {
        contactId,
        dealId: Number.isFinite(dealId) ? dealId! : null,
        accountId: Number.isFinite(accountId) ? accountId! : null,
        discoveryWorkspaceId: body.discoveryWorkspaceId != null ? Number(body.discoveryWorkspaceId) : null,
        status: body.status ?? "draft",
        offerDirection: body.offerDirection ?? null,
        scopeSummary: body.scopeSummary ?? null,
        deliverablesDraft: body.deliverablesDraft ?? null,
        assumptions: body.assumptions ?? null,
        exclusions: body.exclusions ?? null,
        pricingNotes: body.pricingNotes ?? null,
        timelineNotes: body.timelineNotes ?? null,
        risks: body.risks ?? null,
        dependencies: body.dependencies ?? null,
        crossSellOpportunities: body.crossSellOpportunities ?? null,
        decisionFactors: body.decisionFactors ?? null,
        proposalReadinessScore: body.proposalReadinessScore != null ? Number(body.proposalReadinessScore) : null,
        aiSummary: body.aiSummary ?? null,
        createdByUserId: createdByUserId ?? null,
        playbookId: body.playbookId != null ? Number(body.playbookId) : null,
        checklist: Array.isArray(body.checklist) ? body.checklist : defaultChecklist,
      },
      { createdByUserId }
    );
    return NextResponse.json(workspace);
  } catch (error: unknown) {
    console.error("Proposal prep POST error:", error);
    return NextResponse.json({ error: "Failed to create proposal prep workspace" }, { status: 500 });
  }
}
