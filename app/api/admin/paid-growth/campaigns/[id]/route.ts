import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import type { PpcCampaign } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const c = await storage.getPpcCampaignById(id);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const logs = await storage.listPpcPublishLogs(id, 20);
    return NextResponse.json({ ...c, publishLogs: logs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json().catch(() => ({}));
    const updates: Partial<PpcCampaign> = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.clientLabel === "string") updates.clientLabel = body.clientLabel;
    if (typeof body.platform === "string") updates.platform = body.platform;
    if (typeof body.objective === "string") updates.objective = body.objective;
    if (typeof body.status === "string") updates.status = body.status;
    if (typeof body.offerSlug === "string") updates.offerSlug = body.offerSlug;
    if (typeof body.landingPagePath === "string") updates.landingPagePath = body.landingPagePath;
    if (typeof body.thankYouPath === "string") updates.thankYouPath = body.thankYouPath;
    if (typeof body.personaId === "string") updates.personaId = body.personaId;
    if (body.locationTargetingJson != null) updates.locationTargetingJson = body.locationTargetingJson;
    if (body.budgetDailyCents != null) updates.budgetDailyCents = Number(body.budgetDailyCents);
    if (body.scheduleJson != null) updates.scheduleJson = body.scheduleJson;
    if (body.adCopyJson != null) updates.adCopyJson = body.adCopyJson;
    if (Array.isArray(body.creativeAssetUrls)) updates.creativeAssetUrls = body.creativeAssetUrls.map(String);
    if (body.trackingParamsJson != null) updates.trackingParamsJson = body.trackingParamsJson;
    if (body.commCampaignId !== undefined) updates.commCampaignId = body.commCampaignId != null ? Number(body.commCampaignId) : null;
    if (body.ppcAdAccountId !== undefined) updates.ppcAdAccountId = body.ppcAdAccountId != null ? Number(body.ppcAdAccountId) : null;
    if (typeof body.publishPausedDefault === "boolean") updates.publishPausedDefault = body.publishPausedDefault;
    if (typeof body.notes === "string") updates.notes = body.notes;
    const row = await storage.updatePpcCampaign(id, updates);
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
