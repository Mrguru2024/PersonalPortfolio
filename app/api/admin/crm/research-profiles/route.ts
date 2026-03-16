import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const profiles = await storage.getCrmResearchProfiles(
      accountId ? Number(accountId) : undefined
    );
    return NextResponse.json(profiles);
  } catch (error: unknown) {
    if (/crm_research_profiles.*does not exist/i.test(String(error))) {
      return NextResponse.json([]);
    }
    console.error("Error fetching research profiles:", error);
    return NextResponse.json({ error: "Failed to fetch research profiles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const profile = await storage.createCrmResearchProfile({
      accountId: body.accountId,
      contactId: body.contactId ?? null,
      companySummary: body.companySummary ?? null,
      websiteFindings: body.websiteFindings ?? null,
      designUxNotes: body.designUxNotes ?? null,
      messagingNotes: body.messagingNotes ?? null,
      conversionNotes: body.conversionNotes ?? null,
      seoVisibilityNotes: body.seoVisibilityNotes ?? null,
      automationOpportunityNotes: body.automationOpportunityNotes ?? null,
      technicalIssuesNotes: body.technicalIssuesNotes ?? null,
      likelyPainPoints: body.likelyPainPoints ?? null,
      suggestedServiceFit: body.suggestedServiceFit ?? null,
      suggestedOutreachAngle: body.suggestedOutreachAngle ?? null,
      aiGeneratedSummary: body.aiGeneratedSummary ?? null,
      researchConfidence: body.researchConfidence ?? null,
    });
    return NextResponse.json(profile);
  } catch (error: unknown) {
    console.error("Error creating research profile:", error);
    return NextResponse.json({ error: "Failed to create research profile" }, { status: 500 });
  }
}
