import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/user/free-offers — published member-only assets (signed-in users). */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Sign in required" }, { status: 401 });
    }

    const assets = await storage.listPublishedRegisteredFunnelAssets();
    const offers = assets.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      assetType: a.assetType,
      mimeType: a.mimeType,
      fileSizeBytes: a.fileSizeBytes,
      updatedAt: a.updatedAt?.toISOString?.() ?? String(a.updatedAt),
      downloadUrl: `/api/user/free-offers/${a.id}/download`,
    }));

    return NextResponse.json({ offers });
  } catch (error: unknown) {
    console.error("List free offers error:", error);
    return NextResponse.json({ error: "Failed to list offers" }, { status: 500 });
  }
}
