import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listSurveyResponses } from "@server/services/behavior/behaviorAdminService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const surveyId = Number(id);
  if (!Number.isFinite(surveyId) || surveyId < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const limit = Math.min(500, Math.max(20, Number(req.nextUrl.searchParams.get("limit")) || 100));
  const rows = await listSurveyResponses(surveyId, limit);
  return NextResponse.json(rows);
}
