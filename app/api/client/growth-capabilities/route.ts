import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import {
  buildClientGrowthCapabilities,
  getClientGrowthScopeForUser,
} from "@server/services/growthIntelligence/clientGrowthScope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE = "private, max-age=30, stale-while-revalidate=120";

/** GET — module flags + CRM scope for client Growth / Conversion Diagnostics surfaces. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json(
        { eligible: false, reason: "unauthenticated" as const },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const userId = Number(user.id);
    const dbUser = await storage.getUser(userId);
    const eligible = await storage.getClientPortalEligibility(userId);
    const scope = await getClientGrowthScopeForUser(userId);
    const body = buildClientGrowthCapabilities({ eligible, user: dbUser, scope });
    if (!eligible) {
      return NextResponse.json(
        { ...body, eligible: false, reason: "portal_inactive" as const },
        { status: 403, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    return NextResponse.json(body, { headers: { "Cache-Control": CACHE } });
  } catch (e) {
    console.error("[client/growth-capabilities]", e);
    return NextResponse.json({ error: "Failed to load capabilities" }, { status: 500 });
  }
}
