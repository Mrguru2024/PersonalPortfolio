import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import {
  getDealCompleteness,
  getResearchCompleteness,
  type CompletenessResult,
} from "@server/services/crmCompletenessService";
import {
  calculateAiPriorityScore,
  generateNextBestActions,
  type NextBestAction,
} from "@server/services/crmFoundationService";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/insights/deal/[id] — completeness, priority score, next actions. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const deal = await storage.getCrmDealById(id);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const research = deal.accountId
      ? await storage.getCrmResearchProfileByAccountId(deal.accountId)
      : undefined;
    const hasResearch = !!research;

    const dealCompleteness: CompletenessResult = getDealCompleteness(deal);
    const researchCompleteness: CompletenessResult = getResearchCompleteness(research ?? null);
    const aiPriorityScore = calculateAiPriorityScore(deal, hasResearch);
    const nextBestActions: NextBestAction[] = generateNextBestActions(deal, {
      hasResearch,
      contactHasAccount: !!deal.accountId,
    });

    return NextResponse.json({
      dealCompleteness,
      researchCompleteness,
      aiPriorityScore,
      nextBestActions,
    });
  } catch (error: unknown) {
    console.error("Deal insights error:", error);
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
  }
}
