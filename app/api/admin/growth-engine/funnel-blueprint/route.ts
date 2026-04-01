import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { getOrCreateFunnelBlueprint, saveFunnelBlueprint } from "@server/services/growthEngine/growthEngineStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  nodesJson: z.array(z.unknown()),
  edgesJson: z.array(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const key = req.nextUrl.searchParams.get("key")?.trim() || "startup";
  const blueprint = await getOrCreateFunnelBlueprint(key);
  return NextResponse.json({ blueprint });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const key = req.nextUrl.searchParams.get("key")?.trim() || "startup";
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
  const blueprint = await saveFunnelBlueprint(
    key,
    parsed.data.nodesJson,
    parsed.data.edgesJson ?? [],
  );
  return NextResponse.json({ blueprint });
}
