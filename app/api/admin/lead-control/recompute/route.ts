import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { recomputeLeadControlBatch } from "@server/services/leadControl/recomputeLeadControlBatch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  updatePriority: z.boolean().optional().default(true),
  updateRoutingHint: z.boolean().optional().default(true),
  contactIds: z.array(z.number().int().positive()).max(5000).optional(),
  limit: z.number().int().min(1).max(5000).optional(),
});

/** POST /api/admin/lead-control/recompute — batch refresh priority and/or routing hints on CRM leads. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const { updatePriority, updateRoutingHint, contactIds, limit } = parsed.data;
    if (!updatePriority && !updateRoutingHint) {
      return NextResponse.json({ error: "At least one of updatePriority or updateRoutingHint must be true" }, { status: 400 });
    }

    const orgRow = await storage.getLeadControlOrgSettings();
    const result = await recomputeLeadControlBatch(storage, orgRow.config, {
      contactIds,
      updatePriority,
      updateRoutingHint,
      limit,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[POST /api/admin/lead-control/recompute]", e);
    return NextResponse.json({ error: "Failed to recompute" }, { status: 500 });
  }
}
