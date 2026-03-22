import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { executeCommCampaignSend } from "@server/services/communications/sendCommCampaign";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const id = Number((await params).id);
    const result = await executeCommCampaignSend({
      campaignId: id,
      reqOrigin: req.nextUrl?.origin,
      createdByUserId: user?.id ?? null,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.error === "No recipients match this audience" ? 400 : 500 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
