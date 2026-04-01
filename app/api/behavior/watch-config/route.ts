import { NextRequest, NextResponse } from "next/server";
import { getPublicWatchConfig } from "@server/services/behavior/behaviorWatchService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function verifyIngestSecret(req: NextRequest): boolean {
  const secret = process.env.BEHAVIOR_INGEST_SECRET?.trim();
  const publicToken = process.env.BEHAVIOR_INGEST_PUBLIC_TOKEN?.trim();
  if (!secret && !publicToken) return true;
  const auth = req.headers.get("authorization")?.trim();
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  if (secret && token === secret) return true;
  if (publicToken && token === publicToken) return true;
  return false;
}

/** GET /api/behavior/watch-config — same Bearer rules as POST /api/behavior/ingest. */
export async function GET(req: NextRequest) {
  if (!verifyIngestSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessId = req.nextUrl.searchParams.get("businessId")?.trim() || undefined;
  const config = await getPublicWatchConfig(businessId);
  return NextResponse.json(config);
}
