import { NextRequest, NextResponse } from "next/server";
import { getEmailHubTemplateForUser } from "@server/services/emailHub/emailHubService";
import { requireEmailHubSession } from "../../lib/session";

export const dynamic = "force-dynamic";

/** GET /api/admin/email-hub/templates/[id] — one hub template if the user may access it. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const row = await getEmailHubTemplateForUser(user.id, user.isSuper, id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}
