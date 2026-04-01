import { NextRequest, NextResponse } from "next/server";
import { deleteEmailHubDraft, getEmailHubDraft } from "@server/services/emailHub/emailHubService";
import { requireEmailHubSession } from "../../lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number((await params).id);
  const draft = await getEmailHubDraft(id, user.id, user.isSuper);
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(draft);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number((await params).id);
  const ok = await deleteEmailHubDraft(id, user.id, user.isSuper);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
