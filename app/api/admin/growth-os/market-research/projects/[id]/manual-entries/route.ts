import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  addMarketResearchManualEntry,
  listMarketResearchManualEntries,
} from "@server/services/marketResearch/marketResearchService";
import {
  marketResearchManualEntryBodySchema,
  normalizeStringList,
} from "@/lib/market-research/requestSchema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseProjectId(raw: string): number | null {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const projectId = parseProjectId(id);
    if (!projectId) {
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }

    const entries = await listMarketResearchManualEntries(projectId, 200);
    return NextResponse.json({ entries });
  } catch (e) {
    console.error("[GET /api/admin/growth-os/market-research/projects/:id/manual-entries]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const projectId = parseProjectId(id);
    if (!projectId) {
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }

    const user = await getSessionUser(req);
    const actorUserId = user?.id != null ? Number(user.id) : null;

    const parsed = marketResearchManualEntryBodySchema.safeParse(
      await req.json().catch(() => ({})),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const entry = await addMarketResearchManualEntry({
      projectId,
      runId: parsed.data.runId ?? null,
      entryType: parsed.data.entryType,
      content: parsed.data.content,
      tags: normalizeStringList(parsed.data.tags),
      referenceUrl: parsed.data.referenceUrl ?? undefined,
      actorUserId: Number.isFinite(actorUserId) ? actorUserId : null,
    });

    return NextResponse.json({ entry });
  } catch (e) {
    console.error("[POST /api/admin/growth-os/market-research/projects/:id/manual-entries]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
