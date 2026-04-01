import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { updateUserTestCampaign } from "@server/services/behavior/behaviorAdminService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { id: rawId } = await ctx.params;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const patch: Parameters<typeof updateUserTestCampaign>[1] = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (body.hypothesis === null || typeof body.hypothesis === "string") {
    patch.hypothesis = body.hypothesis;
  }
  if (typeof body.active === "boolean") patch.active = body.active;
  if (body.businessId === null || typeof body.businessId === "string") {
    patch.businessId = body.businessId;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }
  const row = await updateUserTestCampaign(id, patch);
  if (!row) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}
