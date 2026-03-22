import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const limit = Math.min(100, Math.max(10, Number(req.nextUrl.searchParams.get("limit")) || 40));
    return NextResponse.json(await storage.listPpcLeadQuality(limit));
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
    const crmContactId = Number(body.crmContactId);
    if (!crmContactId) return NextResponse.json({ error: "crmContactId required" }, { status: 400 });
    const row = await storage.upsertPpcLeadQuality(crmContactId, {
      crmContactId,
      ppcCampaignId: body.ppcCampaignId != null ? Number(body.ppcCampaignId) : null,
      leadValid: body.leadValid,
      fitScore: body.fitScore != null ? Number(body.fitScore) : undefined,
      spamFlag: body.spamFlag,
      bookedCall: body.bookedCall,
      sold: body.sold,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      createdBy: user?.id ?? null,
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
