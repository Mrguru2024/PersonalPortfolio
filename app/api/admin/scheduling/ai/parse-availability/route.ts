import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { aiParseAvailabilityDescription } from "@server/services/schedulingAiService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const description = String(body.description ?? "").trim();
  if (!description) {
    return NextResponse.json({ error: "description required" }, { status: 400 });
  }
  const parsed = await aiParseAvailabilityDescription(description);
  return NextResponse.json(parsed);
}
