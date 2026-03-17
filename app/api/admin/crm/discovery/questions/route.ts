import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { getPersistedGuidance } from "@server/services/crmAiGuidanceService";
import {
  getDefaultDiscoveryQuestions,
  mergeDiscoveryQuestions,
  type AiDiscoveryQuestionsContent,
} from "@server/services/crm/discoveryQuestions";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/discovery/questions?contactId=1&serviceType=web_design — merged default + AI questions. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const serviceType = searchParams.get("serviceType") ?? undefined;
    if (!contactId) {
      return NextResponse.json({ error: "contactId required" }, { status: 400 });
    }
    const cid = Number(contactId);
    if (!Number.isFinite(cid)) {
      return NextResponse.json({ error: "Invalid contactId" }, { status: 400 });
    }
    const contact = await storage.getCrmContactById(cid);
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const defaultQuestions = getDefaultDiscoveryQuestions({ serviceType });
    let aiContent: AiDiscoveryQuestionsContent | null = null;
    const guidance = await getPersistedGuidance(storage, "contact", cid);
    const discoveryGuidance = guidance.find((g) => g.outputType === "discovery_questions");
    if (discoveryGuidance?.content) {
      aiContent = discoveryGuidance.content as AiDiscoveryQuestionsContent;
    }

    const merged = mergeDiscoveryQuestions({
      defaultQuestions,
      aiContent,
    });
    return NextResponse.json(merged);
  } catch (error: unknown) {
    console.error("Discovery questions GET error:", error);
    return NextResponse.json({ error: "Failed to load discovery questions" }, { status: 500 });
  }
}
