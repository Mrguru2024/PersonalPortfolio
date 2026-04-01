import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  createMarketResearchProject,
  getMarketResearchDashboard,
  listMarketResearchProjects,
} from "@server/services/marketResearch/marketResearchService";
import {
  marketResearchProjectCreateSchema,
  normalizeStringList,
} from "@/lib/market-research/requestSchema";
import {
  MARKET_RESEARCH_SOURCE_KEYS,
  type MarketResearchSourceKey,
} from "@shared/marketResearchConstants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden", message: "Admin access required" }, { status: 403 });
    }

    const projectKey = req.nextUrl.searchParams.get("projectKey") ?? "ascendra_main";
    const search = req.nextUrl.searchParams.get("search") ?? "";
    const limitRaw = Number(req.nextUrl.searchParams.get("limit") ?? "120");
    const limit = Number.isFinite(limitRaw) ? limitRaw : 120;

    const projects = await listMarketResearchProjects({ projectKey, search, limit });
    const payload = await getMarketResearchDashboard(projectKey);
    return NextResponse.json({ ...payload, projects });
  } catch (error) {
    console.error("[GET /api/admin/growth-os/market-research/projects]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden", message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);

    const parsed = marketResearchProjectCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const body = parsed.data;
    const keywords = normalizeStringList(body.keywords);
    const competitors = normalizeStringList(body.competitors);
    const subreddits = normalizeStringList(body.subreddits);
    const sourcesEnabled = body.sourcesEnabled.filter((key): key is MarketResearchSourceKey =>
      MARKET_RESEARCH_SOURCE_KEYS.includes(key),
    );

    const row = await createMarketResearchProject({
      projectKey: body.projectKey ?? "ascendra_main",
      name: body.name,
      industry: body.industry,
      niche: body.niche,
      service: body.service,
      location: body.location,
      keywords,
      competitors,
      subreddits,
      sourcesEnabled,
      notes: body.notes,
      actorUserId: user?.id ?? null,
    });

    return NextResponse.json({ project: row }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/growth-os/market-research/projects]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
