import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";
import { fireWorkflows, buildPayloadFromDealId } from "@server/services/workflows/engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const accountId = searchParams.get("accountId");
    const pipelineStage = searchParams.get("pipelineStage");
    const source = searchParams.get("source");
    const urgencyLevel = searchParams.get("urgencyLevel");
    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    let deals = await storage.getCrmDeals(
      contactId ? Number(contactId) : undefined,
      accountId ? Number(accountId) : undefined,
      pipelineStage ?? undefined
    );
    if (source) deals = deals.filter((d) => (d.source ?? "") === source);
    if (urgencyLevel) deals = deals.filter((d) => (d.urgencyLevel ?? "") === urgencyLevel);
    const key = sortBy === "value" ? "value" : sortBy === "score" ? "leadScore" : sortBy === "expectedCloseAt" ? "expectedCloseAt" : "updatedAt";
    deals.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortOrder === "asc" ? -1 : 1;
      if (bVal == null) return sortOrder === "asc" ? 1 : -1;
      const cmp = typeof aVal === "number" && typeof bVal === "number" ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return NextResponse.json(deals);
  } catch (error: any) {
    const msg = error?.message ?? String(error);
    const missingTable = /crm_deals.*does not exist|relation.*crm_deals|table.*crm_deals/i.test(msg);
    if (missingTable) {
      console.warn("CRM deals table missing. Run scripts/create-tables.sql (CRM section) or migrate DB.");
      return NextResponse.json([]);
    }
    console.error("Error fetching CRM deals:", error);
    return NextResponse.json({ error: "Failed to fetch CRM deals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const deal = await storage.createCrmDeal({
      contactId: body.contactId,
      accountId: body.accountId ?? null,
      title: body.title,
      value: body.value ?? 0,
      stage: body.stage ?? body.pipelineStage ?? "qualification",
      pipelineStage: body.pipelineStage ?? "new_lead",
      serviceInterest: body.serviceInterest ?? null,
      primaryPainPoint: body.primaryPainPoint ?? null,
      businessGoal: body.businessGoal ?? null,
      urgencyLevel: body.urgencyLevel ?? null,
      budgetRange: body.budgetRange ?? null,
      confidenceLevel: body.confidenceLevel ?? null,
      lifecycleStage: body.lifecycleStage ?? null,
      leadScore: body.leadScore ?? null,
      aiPriorityScore: body.aiPriorityScore ?? null,
      estimatedCloseProbability: body.estimatedCloseProbability ?? null,
      expectedCloseAt: body.expectedCloseAt ? new Date(body.expectedCloseAt) : null,
      closedAt: body.closedAt ? new Date(body.closedAt) : null,
      source: body.source ?? null,
      campaign: body.campaign ?? null,
      medium: body.medium ?? null,
      referringPage: body.referringPage ?? null,
      landingPage: body.landingPage ?? null,
      notes: body.notes ?? null,
      notesSummary: body.notesSummary ?? null,
    });
    const user = await getSessionUser(req);
    logActivity(storage, {
      contactId: deal.contactId,
      accountId: deal.accountId ?? undefined,
      dealId: deal.id,
      type: "lead_created",
      title: "Lead / opportunity created",
      content: deal.title,
      createdByUserId: user?.id,
    }).catch(() => {});
    const payload = await buildPayloadFromDealId(storage, deal.id).catch(() => ({ dealId: deal.id, contactId: deal.contactId, deal }));
    fireWorkflows(storage, "lead_created", payload).catch(() => {});
    return NextResponse.json(deal);
  } catch (error: any) {
    console.error("Error creating CRM deal:", error);
    return NextResponse.json({ error: "Failed to create CRM deal" }, { status: 500 });
  }
}
