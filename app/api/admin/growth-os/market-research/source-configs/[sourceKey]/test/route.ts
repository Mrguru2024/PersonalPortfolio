import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { marketResearchSourceTestSchema } from "@/lib/market-research/requestSchema";
import {
  testMarketResearchSourceConnection,
} from "@server/services/marketResearch/marketResearchService";
import {
  MARKET_RESEARCH_SOURCE_KEYS,
  type MarketResearchSourceKey,
} from "@shared/marketResearchConstants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseSourceKey(raw: string): MarketResearchSourceKey | null {
  const key = raw.trim();
  return MARKET_RESEARCH_SOURCE_KEYS.includes(key as MarketResearchSourceKey)
    ? (key as MarketResearchSourceKey)
    : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sourceKey: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const body = marketResearchSourceTestSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json({ error: "Validation", details: body.error.flatten() }, { status: 400 });
    }

    const sourceParam = (await params).sourceKey;
    const sourceKey = parseSourceKey(sourceParam);
    if (!sourceKey) {
      return NextResponse.json({ error: "Unknown source key" }, { status: 404 });
    }

    const result = await testMarketResearchSourceConnection({
      projectKey: body.data.projectKey ?? "ascendra_main",
      sourceKey,
      actorUserId: user?.id ?? null,
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("POST /api/admin/growth-os/market-research/source-configs/[sourceKey]/test", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
