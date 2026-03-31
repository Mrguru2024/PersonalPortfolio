import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { updateBehaviorSessionRetention } from "@server/services/behavior/behaviorIngestService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z
  .object({
    retentionImportant: z.boolean().optional(),
    retentionArchived: z.boolean().optional(),
  })
  .refine(
    (o) => typeof o.retentionImportant === "boolean" || typeof o.retentionArchived === "boolean",
    { message: "At least one of retentionImportant, retentionArchived required" },
  );

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ sessionId: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { sessionId } = await ctx.params;
  const sid = decodeURIComponent(sessionId || "").slice(0, 128);
  if (!sid) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const ok = await updateBehaviorSessionRetention(sid, parsed.data);
  if (!ok) {
    return NextResponse.json({ error: "Session not found or nothing to update" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
