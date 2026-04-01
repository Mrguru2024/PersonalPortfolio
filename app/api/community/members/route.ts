import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { getAfnProfilesForDirectory } from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** GET /api/community/members — list members (respecting visibility). Query: industry, businessStage, limit. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const industry = searchParams.get("industry") ?? undefined;
    const businessStage = searchParams.get("businessStage") ?? undefined;
    const founderTribe = searchParams.get("founderTribe") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "50", 10) || 50;

    const profiles = await getAfnProfilesForDirectory({
      currentUserId: user?.id ? Number(user.id) : undefined,
      industry,
      businessStage,
      founderTribe,
      limit,
    });
    return NextResponse.json(profiles);
  } catch (e) {
    console.error("GET community members error:", e);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}
