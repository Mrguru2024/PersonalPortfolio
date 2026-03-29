import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { fireWorkflows, buildPayloadFromDealId } from "@server/services/workflows/engine";
import {
  getLatestAeeAttributionForContact,
  recordAeeCrmAttributionEvent,
} from "@server/services/experimentation/aeeCrmAttributionService";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json();
    const previous = await storage.getCrmDealById(id);
    const deal = await storage.updateCrmDeal(id, body);
    const newStage = body.pipelineStage ?? deal.pipelineStage;
    const previousStage = previous?.pipelineStage ?? null;
    if (newStage && newStage !== previousStage) {
      const payload = await buildPayloadFromDealId(storage, id).catch(() => ({ dealId: id, contactId: deal.contactId, deal, previousStage: previousStage ?? undefined, newStage: newStage ?? undefined }));
      const meta = { previousStage: previousStage ?? undefined, newStage: newStage ?? undefined };
      if (newStage === "proposal_ready") fireWorkflows(storage, "opportunity_marked_proposal_ready", { ...payload, ...meta }).catch(() => {});
      else if (newStage === "won") fireWorkflows(storage, "opportunity_marked_won", { ...payload, ...meta }).catch(() => {});
      else if (newStage === "lost") fireWorkflows(storage, "opportunity_marked_lost", { ...payload, ...meta }).catch(() => {});

      const aee = await getLatestAeeAttributionForContact(deal.contactId).catch(() => null);
      if (aee) {
        if (newStage === "proposal_ready") {
          await recordAeeCrmAttributionEvent({
            contactId: deal.contactId,
            dealId: id,
            experimentId: aee.experimentId,
            variantId: aee.variantId,
            eventKind: "proposal",
            metadataJson: { source: "crm_deal_patch" },
          }).catch(() => {});
        } else if (newStage === "won") {
          await recordAeeCrmAttributionEvent({
            contactId: deal.contactId,
            dealId: id,
            experimentId: aee.experimentId,
            variantId: aee.variantId,
            eventKind: "closed_won",
            valueCents: typeof deal.value === "number" ? deal.value : 0,
            metadataJson: { source: "crm_deal_patch" },
          }).catch(() => {});
        } else if (newStage === "lost") {
          await recordAeeCrmAttributionEvent({
            contactId: deal.contactId,
            dealId: id,
            experimentId: aee.experimentId,
            variantId: aee.variantId,
            eventKind: "closed_lost",
            metadataJson: { source: "crm_deal_patch" },
          }).catch(() => {});
        }
      }
    }
    return NextResponse.json(deal);
  } catch (error: any) {
    console.error("Error updating CRM deal:", error);
    return NextResponse.json({ error: "Failed to update CRM deal" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    await storage.deleteCrmDeal(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting CRM deal:", error);
    return NextResponse.json({ error: "Failed to delete CRM deal" }, { status: 500 });
  }
}
