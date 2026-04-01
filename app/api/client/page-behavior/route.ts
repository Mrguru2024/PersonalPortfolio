import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import {
  buildClientGrowthCapabilities,
  getClientGrowthScopeForUser,
} from "@server/services/growthIntelligence/clientGrowthScope";
import { buildClientPageBehaviorDetail } from "@server/services/growthIntelligence/clientPageBehaviorService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE = "private, max-age=30, stale-while-revalidate=120";

/** GET — ?path=/foo&days=30 — page-level behavior summary (CRM-linked scope). */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const eligible = await storage.getClientPortalEligibility(userId);
    const dbUser = await storage.getUser(userId);
    const scope = await getClientGrowthScopeForUser(userId);
    const caps = buildClientGrowthCapabilities({ eligible, user: dbUser, scope });
    if (!eligible || !caps.modules.pageBehaviorDetail) {
      return NextResponse.json({ error: "Not available" }, { status: 403 });
    }

    const pathRaw = req.nextUrl.searchParams.get("path")?.trim() ?? "";
    const days = Math.min(90, Math.max(7, Number(req.nextUrl.searchParams.get("days") ?? "30") || 30));

    const detail = await buildClientPageBehaviorDetail(userId, pathRaw, days);
    if (!detail) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    return NextResponse.json(detail, { headers: { "Cache-Control": CACHE } });
  } catch (e) {
    console.error("[client/page-behavior]", e);
    return NextResponse.json({ error: "Failed to load page summary" }, { status: 500 });
  }
}
