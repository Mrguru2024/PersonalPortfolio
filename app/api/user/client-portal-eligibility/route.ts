import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET — whether the current user may use the paying-client workspace (/dashboard). */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ eligible: false, reason: "unauthenticated" as const }, { status: 401 });
    }
    const eligible = await storage.getClientPortalEligibility(Number(user.id));
    return NextResponse.json({ eligible });
  } catch (e) {
    console.error("[client-portal-eligibility]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
