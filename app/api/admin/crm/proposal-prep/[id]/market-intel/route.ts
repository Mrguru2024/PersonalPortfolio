import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { updateProposalPrepWorkspace } from "@server/services/crm/proposalPrepService";
import { runProposalMarketIntel } from "@server/services/crm/proposalMarketIntelService";

export const dynamic = "force-dynamic";

/** POST — refresh live market / pricing intel (Brave + grounded OpenAI) and persist on workspace. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const workspace = await storage.getCrmProposalPrepWorkspaceById(id);
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const contact = await storage.getCrmContactById(workspace.contactId);
    const result = await runProposalMarketIntel({ workspace, contact: contact ?? null });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 503 });
    }

    const user = await getSessionUser(req);
    const createdByUserId = user?.id != null ? Number(user.id) : undefined;

    const updated = await updateProposalPrepWorkspace(
      storage,
      id,
      {
        marketIntelSummary: result.summaryMarkdown,
        marketIntelSourcesJson: result.sources,
        marketIntelMetaJson: result.meta,
        marketIntelUpdatedAt: new Date(),
      },
      { createdByUserId }
    );

    return NextResponse.json({
      workspace: updated,
      sourcesCount: result.sources.length,
    });
  } catch (e) {
    console.error("proposal-prep market-intel POST:", e);
    return NextResponse.json({ error: "Failed to run market intel" }, { status: 500 });
  }
}
