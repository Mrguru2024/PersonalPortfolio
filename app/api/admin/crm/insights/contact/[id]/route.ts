import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import {
  getContactCompleteness,
  getResearchCompleteness,
  type CompletenessResult,
} from "@server/services/crmCompletenessService";
import {
  calculateAiFitScore,
  generateNextBestActions,
  type NextBestAction,
} from "@server/services/crmFoundationService";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/insights/contact/[id] — completeness, fit score, next actions. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const contact = await storage.getCrmContactById(id);
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const account = contact.accountId
      ? await storage.getCrmAccountById(contact.accountId)
      : undefined;
    const research = contact.accountId
      ? await storage.getCrmResearchProfileByAccountId(contact.accountId)
      : undefined;
    const deals = await storage.getCrmDeals(id);
    const primaryDeal = deals[0];

    const contactCompleteness: CompletenessResult = getContactCompleteness(contact);
    const researchCompleteness: CompletenessResult = getResearchCompleteness(research ?? null);
    const aiFitScore = calculateAiFitScore(contact, account ?? null);
    let nextBestActions: NextBestAction[] = [];
    if (primaryDeal) {
      nextBestActions = generateNextBestActions(primaryDeal, {
        hasResearch: !!research,
        contactHasAccount: !!contact.accountId,
      });
    } else {
      nextBestActions = [
        { action: "Create opportunity / lead", reason: "No lead linked yet", priority: "high" as const },
        ...(contact.accountId ? [] : [{ action: "Add account", reason: "Link to company", priority: "high" as const }]),
      ];
    }

    return NextResponse.json({
      contactCompleteness,
      researchCompleteness,
      aiFitScore,
      nextBestActions,
    });
  } catch (error: unknown) {
    console.error("Contact insights error:", error);
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
  }
}
