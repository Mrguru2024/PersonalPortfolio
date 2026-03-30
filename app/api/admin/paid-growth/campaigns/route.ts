import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { parseCampaignModel } from "@shared/ppcCampaignModel";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json(await storage.listPpcCampaigns());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const platform = typeof body.platform === "string" ? body.platform : "meta";
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const campaignModel =
      typeof body.campaignModel === "string" ? parseCampaignModel(body.campaignModel) : parseCampaignModel(undefined);
    const row = await storage.createPpcCampaign({
      name,
      campaignModel,
      clientLabel: typeof body.clientLabel === "string" ? body.clientLabel : null,
      platform: platform === "google_ads" ? "google_ads" : "meta",
      objective: typeof body.objective === "string" ? body.objective : "traffic",
      status: "draft",
      offerSlug: typeof body.offerSlug === "string" ? body.offerSlug : null,
      landingPagePath: typeof body.landingPagePath === "string" ? body.landingPagePath : "/",
      thankYouPath: typeof body.thankYouPath === "string" ? body.thankYouPath : null,
      personaId: typeof body.personaId === "string" ? body.personaId : null,
      locationTargetingJson: body.locationTargetingJson ?? {},
      budgetDailyCents: body.budgetDailyCents != null ? Number(body.budgetDailyCents) : null,
      scheduleJson: body.scheduleJson ?? {},
      adCopyJson: body.adCopyJson ?? {},
      creativeAssetUrls: Array.isArray(body.creativeAssetUrls) ? body.creativeAssetUrls.map(String) : [],
      trackingParamsJson: body.trackingParamsJson ?? {},
      commCampaignId: body.commCampaignId != null ? Number(body.commCampaignId) : null,
      ppcAdAccountId: body.ppcAdAccountId != null ? Number(body.ppcAdAccountId) : null,
      publishPausedDefault: body.publishPausedDefault !== false,
      notes: typeof body.notes === "string" ? body.notes : null,
      createdBy: user?.id ?? null,
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
