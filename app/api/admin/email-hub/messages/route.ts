import { NextRequest, NextResponse } from "next/server";
import { listEmailHubMessages } from "@server/services/emailHub/emailHubService";
import { requireEmailHubSession } from "../lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const messages = await listEmailHubMessages(user.id, user.isSuper, status ?? undefined);
  return NextResponse.json(messages);
}
