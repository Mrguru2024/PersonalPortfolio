import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  applyAgencyTaskAcceptance,
  listTaskEvents,
} from "@server/services/agencyOs/agencyOsService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const acceptanceBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("accept"),
    understandingConfirmed: z.boolean().refine((v) => v === true, "Confirm understanding"),
    responsibilityConfirmed: z.boolean().refine((v) => v === true, "Confirm responsibility"),
  }),
  z.object({
    action: z.literal("decline"),
    declineReason: z.string().trim().min(3).max(4000),
  }),
  z.object({
    action: z.literal("clarify"),
    clarificationMessage: z.string().trim().min(5).max(8000),
  }),
]);

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const user = await getSessionUser(req);
  if (!user?.adminApproved) {
    return NextResponse.json({ message: "Approved admin required" }, { status: 403 });
  }
  const taskId = Number.parseInt((await ctx.params).id, 10);
  if (!Number.isFinite(taskId)) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = acceptanceBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid acceptance payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const uid = typeof user.id === "number" ? user.id : Number(user.id);
  if (!Number.isFinite(uid)) {
    return NextResponse.json({ error: "Invalid session user" }, { status: 400 });
  }

  try {
    const task = await applyAgencyTaskAcceptance({
      taskId,
      actorUserId: uid,
      actorIsApprovedAdmin: !!user.adminApproved,
      action: parsed.data.action,
      understandingConfirmed: parsed.data.action === "accept" ? parsed.data.understandingConfirmed : undefined,
      responsibilityConfirmed: parsed.data.action === "accept" ? parsed.data.responsibilityConfirmed : undefined,
      declineReason: parsed.data.action === "decline" ? parsed.data.declineReason : undefined,
      clarificationMessage: parsed.data.action === "clarify" ? parsed.data.clarificationMessage : undefined,
    });
    const events = await listTaskEvents(taskId);
    return NextResponse.json({ task, events });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Acceptance failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
