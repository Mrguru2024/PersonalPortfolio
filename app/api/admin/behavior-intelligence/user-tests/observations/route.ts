import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  createUserTestObservation,
  listObservationsForCampaign,
} from "@server/services/behavior/behaviorAdminService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const campaignId = Number(req.nextUrl.searchParams.get("campaignId"));
  if (!Number.isFinite(campaignId) || campaignId < 1) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }
  const limit = Math.min(200, Math.max(10, Number(req.nextUrl.searchParams.get("limit")) || 50));
  const rows = await listObservationsForCampaign(campaignId, limit);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const campaignId = Number(body?.campaignId);
  const notes = typeof body?.notes === "string" ? body.notes : "";
  if (!Number.isFinite(campaignId) || campaignId < 1) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }
  if (!notes.trim()) {
    return NextResponse.json({ error: "notes required" }, { status: 400 });
  }
  const row = await createUserTestObservation({
    campaignId,
    notes,
    sessionId: typeof body?.sessionId === "string" ? body.sessionId : null,
    crmContactId: typeof body?.crmContactId === "number" ? body.crmContactId : null,
  });
  return NextResponse.json(row);
}
