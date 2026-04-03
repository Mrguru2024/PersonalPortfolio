import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  listMarketResearchSourceConfigs,
  updateMarketResearchSourceConfig,
} from "@server/services/marketResearch/marketResearchService";
import { marketResearchSourceConfigUpdateSchema } from "@/lib/market-research/requestSchema";
import {
  MARKET_RESEARCH_SOURCE_KEYS,
  type MarketResearchSourceKey,
} from "@shared/marketResearchConstants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const projectKey = req.nextUrl.searchParams.get("projectKey") ?? "ascendra_main";
    const configs = await listMarketResearchSourceConfigs(projectKey);
    return NextResponse.json({ sourceConfigs: configs });
  } catch (error) {
    console.error("GET /api/admin/growth-os/market-research/source-configs", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const parsed = marketResearchSourceConfigUpdateSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const row = await updateMarketResearchSourceConfig({
      projectKey: parsed.data.projectKey,
      sourceKey: parsed.data.sourceKey as MarketResearchSourceKey,
      enabled: parsed.data.enabled,
      fallbackEnabled: parsed.data.fallbackEnabled,
      setupStatus: parsed.data.setupStatus,
      checklistJson: parsed.data.checklistJson,
      configJson: parsed.data.configJson,
      actorUserId: user?.id ?? null,
    });

    return NextResponse.json({ sourceConfig: row });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unknown source key")) {
      return NextResponse.json(
        { error: "Validation", details: { sourceKey: MARKET_RESEARCH_SOURCE_KEYS } },
        { status: 400 },
      );
    }
    console.error("PATCH /api/admin/growth-os/market-research/source-configs", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
