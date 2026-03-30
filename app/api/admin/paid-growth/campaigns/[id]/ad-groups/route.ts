import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { PPC_AD_GROUP_STATUSES } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

function okStatus(s: unknown): s is (typeof PPC_AD_GROUP_STATUSES)[number] {
  return typeof s === "string" && (PPC_AD_GROUP_STATUSES as readonly string[]).includes(s);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const campaignId = Number((await params).id);
    const c = await storage.getPpcCampaignById(campaignId);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const adGroups = await storage.listPpcAdGroupsByCampaign(campaignId);
    return NextResponse.json({ adGroups });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load ad groups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const campaignId = Number((await params).id);
    const c = await storage.getPpcCampaignById(campaignId);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const status =
      okStatus(body.status) ? body.status
      : "draft";
    const row = await storage.createPpcAdGroup({
      campaignId,
      name,
      status,
      serviceCategory: typeof body.serviceCategory === "string" ? body.serviceCategory : null,
      deviceSegmentJson: body.deviceSegmentJson && typeof body.deviceSegmentJson === "object" ? body.deviceSegmentJson : {},
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      strategyNotes: typeof body.strategyNotes === "string" ? body.strategyNotes : null,
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
