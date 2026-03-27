import { NextRequest, NextResponse } from "next/server";
import { getEmailHubMessageById, listEmailHubEventsForMessage } from "@server/services/emailHub/emailHubService";
import { requireEmailHubSession } from "../../lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number((await params).id);
  const message = await getEmailHubMessageById(id, user.id, user.isSuper);
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const events = await listEmailHubEventsForMessage(id);
  return NextResponse.json({ message, events });
}
