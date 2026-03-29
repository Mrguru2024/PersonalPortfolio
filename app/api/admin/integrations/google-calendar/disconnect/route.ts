import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { disconnectGoogleCalendarForUser } from "@server/services/googleCalendarSchedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }
  const user = await getSessionUser(req);
  const userId = user?.id != null ? Number(user.id) : NaN;
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ message: "Could not resolve your user id." }, { status: 401 });
  }
  await disconnectGoogleCalendarForUser(userId);
  return NextResponse.json({ ok: true });
}
