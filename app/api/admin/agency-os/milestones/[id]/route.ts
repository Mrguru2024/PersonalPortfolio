import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { updateDeliveryMilestone } from "@server/services/agencyOs/agencyOsService";
import { agencyOsMilestonePatchSchema } from "@shared/agencyOsValidation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const user = await getSessionUser(req);
  if (!user?.adminApproved) {
    return NextResponse.json({ message: "Approved admin required" }, { status: 403 });
  }
  const milestoneId = Number.parseInt((await ctx.params).id, 10);
  if (!Number.isFinite(milestoneId)) {
    return NextResponse.json({ error: "Invalid milestone id" }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = agencyOsMilestonePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    const milestone = await updateDeliveryMilestone(milestoneId, parsed.data);
    return NextResponse.json({ milestone });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
