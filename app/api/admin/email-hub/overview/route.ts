import { NextRequest, NextResponse } from "next/server";
import { getEmailHubOverview } from "@server/services/emailHub/emailHubService";
import { requireEmailHubSession } from "../lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await requireEmailHubSession(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const overview = await getEmailHubOverview(user);
  return NextResponse.json(overview);
}
