import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { runSocialProfileDiscovery } from "@server/services/crm/socialProfileDiscoveryService";
import { logActivity } from "@server/services/crmFoundationService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const contactId = Number((await params).id);
    if (!Number.isFinite(contactId)) {
      return NextResponse.json({ error: "Invalid contact id" }, { status: 400 });
    }
    const contact = await storage.getCrmContactById(contactId);
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    await storage.supersedeSuggestedSocialSuggestions(contactId);
    const result = await runSocialProfileDiscovery(contact);
    const rows = result.suggestions.map((s) => ({ ...s, contactId }));
    const saved = await storage.createCrmContactSocialSuggestions(rows);

    const user = await getSessionUser(req);
    await logActivity(storage, {
      contactId,
      type: "research_updated",
      title: "Social profile discovery",
      content: `${saved.length} suggestion(s). Brave: ${result.usedBrave ? "yes" : "no"} · OpenAI rank: ${result.usedOpenAI ? "yes" : "no"}`,
      metadata: { runId: result.runId, discovery: "social_profiles" },
      createdByUserId: user?.id ?? undefined,
    });

    return NextResponse.json({
      runId: result.runId,
      usedBrave: result.usedBrave,
      usedOpenAI: result.usedOpenAI,
      manualSearchLinks: result.manualSearchLinks,
      suggestions: saved,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Social discovery failed" }, { status: 500 });
  }
}
