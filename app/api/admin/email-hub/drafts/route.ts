import { NextRequest, NextResponse } from "next/server";
import { listEmailHubDrafts, saveEmailHubDraft } from "@server/services/emailHub/emailHubService";
import { requireEmailHubSession } from "../lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const drafts = await listEmailHubDrafts(user.id, user.isSuper);
  return NextResponse.json(drafts);
}

export async function POST(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const scheduledForRaw = body.scheduledFor;
    const scheduledFor =
      typeof scheduledForRaw === "string" && scheduledForRaw ? new Date(scheduledForRaw) : null;
    const draft = await saveEmailHubDraft(user.id, user.isSuper, {
      id: body.id != null ? Number(body.id) : undefined,
      senderId: Number(body.senderId),
      to: Array.isArray(body.to) ? (body.to as string[]).map(String) : [],
      cc: Array.isArray(body.cc) ? (body.cc as string[]).map(String) : undefined,
      bcc: Array.isArray(body.bcc) ? (body.bcc as string[]).map(String) : undefined,
      subject: String(body.subject ?? ""),
      htmlBody: String(body.htmlBody ?? ""),
      textBody: body.textBody != null ? String(body.textBody) : null,
      scheduledFor: scheduledFor && !Number.isNaN(scheduledFor.getTime()) ? scheduledFor : null,
      status: body.status === "scheduled" ? "scheduled" : "draft",
      templateId: body.templateId != null ? Number(body.templateId) : null,
      relatedContactId: body.relatedContactId != null ? Number(body.relatedContactId) : null,
    });
    return NextResponse.json(draft);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
