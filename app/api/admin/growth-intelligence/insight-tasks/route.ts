import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { createGrowthInsightTask, listGrowthInsightTasks } from "@server/services/growthIntelligence/growthInsightTaskService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const postSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().max(24_000).optional().nullable(),
  businessId: z.string().max(120).optional().nullable(),
  visibleToClient: z.boolean().optional(),
  clientCrmAccountId: z.number().int().positive().nullable().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  pagePath: z.string().max(2048).optional().nullable(),
  behaviorSessionKey: z.string().max(200).optional().nullable(),
  surveyId: z.number().int().positive().optional().nullable(),
  heatmapPage: z.string().max(2048).optional().nullable(),
  evidenceJson: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "80") || 80));
  const rows = await listGrowthInsightTasks(limit);
  return NextResponse.json({ tasks: rows });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const user = await getSessionUser(req);
  const uid = user?.id != null ? Number(user.id) : null;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.visibleToClient && (parsed.data.clientCrmAccountId == null || parsed.data.clientCrmAccountId < 1)) {
    return NextResponse.json(
      { message: "visibleToClient requires clientCrmAccountId (positive CRM account id)." },
      { status: 400 },
    );
  }
  const row = await createGrowthInsightTask({
    ...parsed.data,
    createdByUserId: Number.isFinite(uid!) ? uid! : null,
  });
  return NextResponse.json({ task: row });
}
