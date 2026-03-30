import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { buildClientGrowthSnapshot } from "@server/services/clientGrowth/buildClientGrowthSnapshot";
import {
  getCachedClientGrowthSnapshot,
  upsertClientGrowthSnapshotCache,
} from "@server/services/clientGrowth/clientGrowthSnapshotCache";
import { clientGrowthSnapshotSchema } from "@shared/clientGrowthSnapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CLIENT_CACHE_CONTROL = "private, max-age=15, stale-while-revalidate=60";

/** GET — client-safe growth snapshot for eligible portal users. */
export async function GET(_req: NextRequest) {
  try {
    const user = await getSessionUser(_req);
    if (!user?.id) {
      return NextResponse.json({ error: "Sign in to view your growth system" }, { status: 401 });
    }
    const userId = Number(user.id);
    const eligible = await storage.getClientPortalEligibility(userId);
    if (!eligible) {
      return NextResponse.json({ error: "Growth system is not available for your account" }, { status: 403 });
    }

    const cached = await getCachedClientGrowthSnapshot(userId);
    if (cached) {
      return NextResponse.json(cached, { headers: { "Cache-Control": CLIENT_CACHE_CONTROL } });
    }

    const raw = await buildClientGrowthSnapshot(userId);
    const snapshot = clientGrowthSnapshotSchema.parse(raw);
    void upsertClientGrowthSnapshotCache(userId, snapshot).catch((err) =>
      console.error("[client/growth-snapshot] cache upsert", err),
    );
    return NextResponse.json(snapshot, { headers: { "Cache-Control": CLIENT_CACHE_CONTROL } });
  } catch (e) {
    console.error("[client/growth-snapshot]", e);
    return NextResponse.json({ error: "Failed to load growth snapshot" }, { status: 500 });
  }
}
