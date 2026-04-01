import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { growthEngineOverview } from "@server/services/growthEngine/growthEngineStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const data = await growthEngineOverview();
  return NextResponse.json(data);
}
