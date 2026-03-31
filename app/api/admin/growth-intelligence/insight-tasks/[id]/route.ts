import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import {
  getGrowthInsightTaskById,
  updateGrowthInsightTask,
} from "@server/services/growthIntelligence/growthInsightTaskService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  body: z.string().max(24_000).optional().nullable(),
  status: z.enum(["open", "in_progress", "done", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  visibleToClient: z.boolean().optional(),
  clientCrmAccountId: z.number().int().positive().nullable().optional(),
  assigneeUserId: z.number().int().positive().nullable().optional(),
  evidenceJson: z.record(z.unknown()).optional(),
  pagePath: z.string().max(2048).optional().nullable(),
  behaviorSessionKey: z.string().max(200).optional().nullable(),
  surveyId: z.number().int().positive().nullable().optional(),
  heatmapPage: z.string().max(2048).optional().nullable(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { id: idRaw } = await ctx.params;
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const existing = await getGrowthInsightTaskById(id);
  if (!existing) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  const mergedVisible = parsed.data.visibleToClient ?? existing.visibleToClient;
  const mergedAccount =
    parsed.data.clientCrmAccountId !== undefined ? parsed.data.clientCrmAccountId : existing.clientCrmAccountId;
  if (mergedVisible && (mergedAccount == null || mergedAccount < 1)) {
    return NextResponse.json(
      { message: "Client visibility requires clientCrmAccountId (CRM account) when enabling." },
      { status: 400 },
    );
  }
  const row = await updateGrowthInsightTask(id, parsed.data);
  if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ task: row });
}
