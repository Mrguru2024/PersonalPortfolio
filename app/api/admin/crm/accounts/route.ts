import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const accounts = await storage.getCrmAccounts();
    return NextResponse.json(accounts);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/crm_accounts.*does not exist|relation.*crm_accounts/i.test(msg)) {
      return NextResponse.json([]);
    }
    console.error("Error fetching CRM accounts:", error);
    return NextResponse.json({ error: "Failed to fetch CRM accounts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const account = await storage.createCrmAccount({
      name: body.name,
      website: body.website ?? null,
      domain: body.domain ?? null,
      industry: body.industry ?? null,
      businessType: body.businessType ?? null,
      companySize: body.companySize ?? null,
      estimatedRevenueRange: body.estimatedRevenueRange ?? null,
      location: body.location ?? null,
      serviceArea: body.serviceArea ?? null,
      currentWebsiteStatus: body.currentWebsiteStatus ?? null,
      currentMarketingMaturity: body.currentMarketingMaturity ?? null,
      growthPainPoints: body.growthPainPoints ?? null,
      leadSource: body.leadSource ?? null,
      accountStatus: body.accountStatus ?? "active",
      tags: body.tags ?? null,
      notesSummary: body.notesSummary ?? null,
      ownerUserId: body.ownerUserId ?? null,
    });
    const user = await getSessionUser(req);
    logActivity(storage, {
      accountId: account.id,
      type: "account_created",
      title: "Account created",
      content: account.name,
      createdByUserId: user?.id,
    }).catch(() => {});
    return NextResponse.json(account);
  } catch (error: unknown) {
    console.error("Error creating CRM account:", error);
    return NextResponse.json({ error: "Failed to create CRM account" }, { status: 500 });
  }
}
