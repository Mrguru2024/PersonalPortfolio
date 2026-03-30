import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { createUserTestCampaign, listUserTestCampaigns } from "@server/services/behavior/behaviorAdminService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const campaigns = await listUserTestCampaigns();
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  if (!name.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const row = await createUserTestCampaign({
    name,
    hypothesis: typeof body?.hypothesis === "string" ? body.hypothesis : null,
    businessId: typeof body?.businessId === "string" ? body.businessId : null,
    active: body?.active !== false,
  });
  return NextResponse.json(row);
}
