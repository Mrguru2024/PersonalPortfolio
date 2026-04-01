import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  getMarketResearchProjectDetail,
  updateMarketResearchProject,
} from "@server/services/marketResearch/marketResearchService";
import {
  marketResearchProjectUpdateSchema,
  normalizeStringList,
} from "@/lib/market-research/requestSchema";
import { MARKET_RESEARCH_SOURCE_KEYS } from "@shared/marketResearchConstants";
import type { MarketResearchSourceKey } from "@shared/marketResearchConstants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseProjectId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: rawId } = await ctx.params;
    const projectId = parseProjectId(rawId);
    if (!projectId) {
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }

    const detail = await getMarketResearchProjectDetail(projectId);
    if (!detail) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    console.error("[GET /api/admin/growth-os/market-research/projects/[id]]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: rawId } = await ctx.params;
    const projectId = parseProjectId(rawId);
    if (!projectId) {
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }
    const parsed = marketResearchProjectUpdateSchema.safeParse(
      await req.json().catch(() => ({})),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const user = await getSessionUser(req);
    const sourcesEnabled =
      parsed.data.sourcesEnabled != null
        ? parsed.data.sourcesEnabled.filter((key): key is MarketResearchSourceKey =>
            MARKET_RESEARCH_SOURCE_KEYS.includes(key),
          )
        : undefined;
    const updated = await updateMarketResearchProject({
      projectId,
      name: parsed.data.name,
      industry: parsed.data.industry,
      niche: parsed.data.niche,
      service: parsed.data.service,
      location: parsed.data.location,
      keywords:
        parsed.data.keywords != null
          ? normalizeStringList(parsed.data.keywords)
          : undefined,
      competitors:
        parsed.data.competitors != null
          ? normalizeStringList(parsed.data.competitors)
          : undefined,
      subreddits:
        parsed.data.subreddits != null
          ? normalizeStringList(parsed.data.subreddits)
          : undefined,
      sourcesEnabled,
      notes: parsed.data.notes,
      status: parsed.data.status,
      actorUserId: user?.id ?? null,
    });
    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/growth-os/market-research/projects/[id]]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
