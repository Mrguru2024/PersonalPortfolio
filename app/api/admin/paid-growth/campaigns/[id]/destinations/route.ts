import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { PPC_DESTINATION_KINDS } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

function okKind(s: unknown): s is (typeof PPC_DESTINATION_KINDS)[number] {
  return typeof s === "string" && (PPC_DESTINATION_KINDS as readonly string[]).includes(s);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const campaignId = Number((await params).id);
    const c = await storage.getPpcCampaignById(campaignId);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const destinations = await storage.listPpcCampaignDestinations(campaignId);
    return NextResponse.json({ destinations });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load destinations" }, { status: 500 });
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
    const path = typeof body.path === "string" ? body.path.trim() : "";
    if (!path || !path.startsWith("/")) {
      return NextResponse.json({ error: "path must start with /" }, { status: 400 });
    }
    const kind = okKind(body.kind) ? body.kind : "primary";
    const row = await storage.createPpcCampaignDestination({
      campaignId,
      kind,
      path,
      offerSlug: typeof body.offerSlug === "string" ? body.offerSlug : null,
      weight: typeof body.weight === "number" && body.weight > 0 ? body.weight : 100,
      notes: typeof body.notes === "string" ? body.notes : null,
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
