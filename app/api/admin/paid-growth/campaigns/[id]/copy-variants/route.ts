import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { PPC_COPY_ANGLES } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

function parseStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim());
}

function okAngle(s: unknown): s is (typeof PPC_COPY_ANGLES)[number] {
  return typeof s === "string" && (PPC_COPY_ANGLES as readonly string[]).includes(s);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const campaignId = Number((await params).id);
    const c = await storage.getPpcCampaignById(campaignId);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const variants = await storage.listPpcAdCopyVariantsByCampaign(campaignId);
    return NextResponse.json({ variants });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load copy variants" }, { status: 500 });
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
    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (!label) return NextResponse.json({ error: "label required" }, { status: 400 });
    const headlines = parseStringArray(body.headlinesJson) ?? [];
    const primaryTexts = parseStringArray(body.primaryTextsJson) ?? [];
    const row = await storage.createPpcAdCopyVariant({
      campaignId,
      adGroupId: typeof body.adGroupId === "number" ? body.adGroupId : null,
      label,
      copyAngle: okAngle(body.copyAngle) ? body.copyAngle : "service",
      headlinesJson: headlines,
      primaryTextsJson: primaryTexts,
      descriptionsJson: parseStringArray(body.descriptionsJson) ?? [],
      ctasJson: parseStringArray(body.ctasJson) ?? [],
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      isActive: body.isActive !== false,
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
