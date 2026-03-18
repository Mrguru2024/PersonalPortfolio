import { NextRequest, NextResponse } from "next/server";
import { getAfnResources } from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** GET /api/community/resources — list published resources. Query: featured, limit. */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const featured = searchParams.get("featured") === "true";
    const limit = parseInt(searchParams.get("limit") ?? "50", 10) || 50;
    const resources = await getAfnResources({ featured, limit });
    return NextResponse.json(resources);
  } catch (e) {
    console.error("GET community resources error:", e);
    return NextResponse.json({ error: "Failed to load resources" }, { status: 500 });
  }
}
