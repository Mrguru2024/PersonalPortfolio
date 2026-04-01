import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listPpcCampaignModelOptions } from "@shared/ppcCampaignModel";

export const dynamic = "force-dynamic";

/** GET — modular PPC engine catalog (admin picker; no secrets). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const models = listPpcCampaignModelOptions();
    return NextResponse.json({ models });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
