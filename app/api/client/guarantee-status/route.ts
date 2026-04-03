import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { buildGuaranteeSnapshotForClient } from "@server/services/guaranteeEngineService";
import { guaranteeSnapshotSchema } from "@shared/guaranteeEngine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CLIENT_CACHE_CONTROL = "private, max-age=15, stale-while-revalidate=60";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Sign in to view guarantee status" }, { status: 401 });
    }

    const userId = Number(user.id);
    const eligible = await storage.getClientPortalEligibility(userId);
    if (!eligible) {
      return NextResponse.json(
        { error: "Guarantee status is not available for your account" },
        { status: 403 },
      );
    }

    const snapshot = await buildGuaranteeSnapshotForClient(userId, 30);
    const parsed = guaranteeSnapshotSchema.parse(snapshot);
    return NextResponse.json(parsed, { headers: { "Cache-Control": CLIENT_CACHE_CONTROL } });
  } catch (error) {
    console.error("[client/guarantee-status]", error);
    return NextResponse.json({ error: "Failed to load guarantee status" }, { status: 500 });
  }
}
