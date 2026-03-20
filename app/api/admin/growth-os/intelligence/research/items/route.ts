import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listResearchItems, listRecentBatches } from "@server/services/growthIntelligence/researchIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const projectKey = searchParams.get("projectKey") ?? undefined;
    const itemKind = searchParams.get("itemKind") ?? undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 80;
    const items = await listResearchItems({ projectKey, itemKind, limit });
    const batches = projectKey ? await listRecentBatches(projectKey, 15) : [];
    return NextResponse.json({ items, batches });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
