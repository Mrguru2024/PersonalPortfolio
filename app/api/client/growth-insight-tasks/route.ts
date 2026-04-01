import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import type { ClientInsightTaskView } from "@shared/clientGrowthCapabilities";
import type { GrowthInsightTask } from "@shared/schema";
import { buildClientGrowthCapabilities, getClientGrowthScopeForUser } from "@server/services/growthIntelligence/clientGrowthScope";
import { listClientVisibleInsightTasks } from "@server/services/growthIntelligence/growthInsightTaskService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toClientView(row: GrowthInsightTask): ClientInsightTaskView {
  const statusLabel =
    row.status === "done" ? "Completed"
    : row.status === "in_progress" ? "In progress"
    : row.status === "open" ? "Recommended"
    : row.status;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    status: row.status,
    statusLabel,
    priority: row.priority,
    pagePath: row.pagePath,
    heatmapPage: row.heatmapPage,
    updatedAt: row.updatedAt.toISOString(),
  };
}

const CACHE = "private, max-age=15, stale-while-revalidate=60";

/** GET — insight tasks Ascendra has shared with this client’s CRM account(s). */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const eligible = await storage.getClientPortalEligibility(userId);
    const dbUser = await storage.getUser(userId);
    const scope = await getClientGrowthScopeForUser(userId);
    const caps = buildClientGrowthCapabilities({ eligible, user: dbUser, scope });
    if (!eligible) {
      return NextResponse.json({ error: "Growth workspace not available" }, { status: 403 });
    }
    if (!caps.modules.sharedImprovements) {
      return NextResponse.json({
        tasks: [] satisfies ClientInsightTaskView[],
        moduleDisabled: true as const,
      });
    }
    const limit = Math.min(120, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "40") || 40));
    const rows = await listClientVisibleInsightTasks(scope.accountIds, limit);
    return NextResponse.json(
      { tasks: rows.map(toClientView) },
      { headers: { "Cache-Control": CACHE } },
    );
  } catch (e) {
    console.error("[client/growth-insight-tasks]", e);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}
