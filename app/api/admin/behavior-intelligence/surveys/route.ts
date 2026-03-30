import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { createSurvey, listSurveysForAdmin } from "@server/services/behavior/behaviorAdminService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const rows = await listSurveysForAdmin();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question : "";
  if (!question.trim()) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }
  const row = await createSurvey({
    question,
    triggerType: typeof body?.triggerType === "string" ? body.triggerType : "time_based",
    businessId: typeof body?.businessId === "string" ? body.businessId : null,
    active: body?.active !== false,
  });
  return NextResponse.json(row);
}
