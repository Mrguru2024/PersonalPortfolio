import { NextRequest, NextResponse } from "next/server";
import {
  listEmailHubTemplates,
  saveEmailHubTemplate,
  listCommunicationsDesignsAsTemplates,
} from "@server/services/emailHub/emailHubService";
import { requireEmailHubSession } from "../lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const hub = await listEmailHubTemplates(user.id, user.isSuper);
  const commDesigns = await listCommunicationsDesignsAsTemplates();
  return NextResponse.json({ hubTemplates: hub, communicationsDesigns: commDesigns });
}

export async function POST(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const row = await saveEmailHubTemplate(user.id, user.isSuper, {
      id: body.id != null ? Number(body.id) : undefined,
      name: String(body.name ?? ""),
      category: body.category != null ? String(body.category) : undefined,
      subjectTemplate: String(body.subjectTemplate ?? ""),
      htmlTemplate: String(body.htmlTemplate ?? ""),
      textTemplate: body.textTemplate != null ? String(body.textTemplate) : null,
      accessScope: body.accessScope != null ? String(body.accessScope) : undefined,
      commEmailDesignId: body.commEmailDesignId != null ? Number(body.commEmailDesignId) : null,
    });
    return NextResponse.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
