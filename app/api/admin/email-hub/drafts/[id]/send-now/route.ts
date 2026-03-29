import { NextRequest, NextResponse } from "next/server";
import { forceSendEmailHubScheduledDraftNow } from "@server/services/emailHub/emailHubService";
import { requireEmailHubSession } from "../../../lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST — send a scheduled draft immediately (deletes draft row on success). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const result = await forceSendEmailHubScheduledDraftNow(id, user.id, user.isSuper);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error === "Draft not found" ? 404 : 400 });
  }
  return NextResponse.json({ ok: true, messageId: result.messageId, brevoMessageId: result.brevoMessageId });
}
