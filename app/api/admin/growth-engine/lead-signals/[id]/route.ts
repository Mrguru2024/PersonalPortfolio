import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { dismissGrowthLeadSignal, markGrowthLeadSignalRead } from "@server/services/growthEngine/growthEngineStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  dismiss: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { id: raw } = await ctx.params;
  const id = Number(raw);
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
    return NextResponse.json({ message: "Validation failed" }, { status: 400 });
  }
  if (parsed.data.dismiss) {
    const row = await dismissGrowthLeadSignal(id);
    if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ signal: row });
  }
  const row = await markGrowthLeadSignalRead(id);
  if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ signal: row });
}
