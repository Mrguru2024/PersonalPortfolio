import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { buildClientGrowthSnapshot } from "@server/services/clientGrowth/buildClientGrowthSnapshot";
import { clientGrowthSnapshotSchema } from "@shared/clientGrowthSnapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET — client-safe growth snapshot for eligible portal users. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Sign in to view your growth system" }, { status: 401 });
    }
    const eligible = await storage.getClientPortalEligibility(Number(user.id));
    if (!eligible) {
      return NextResponse.json({ error: "Growth system is not available for your account" }, { status: 403 });
    }
    const raw = await buildClientGrowthSnapshot(Number(user.id));
    const snapshot = clientGrowthSnapshotSchema.parse(raw);
    return NextResponse.json(snapshot);
  } catch (e) {
    console.error("[client/growth-snapshot]", e);
    return NextResponse.json({ error: "Failed to load growth snapshot" }, { status: 500 });
  }
}
