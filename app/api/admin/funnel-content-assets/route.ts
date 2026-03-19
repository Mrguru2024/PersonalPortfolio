import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/funnel-content-assets — list assets. Query: status, leadMagnetSlug */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const leadMagnetSlug = searchParams.get("leadMagnetSlug") ?? undefined;
    const assets = await storage.listFunnelContentAssets({ status, leadMagnetSlug });
    const serialized = assets.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      assetType: a.assetType,
      fileUrl: a.fileUrl,
      mimeType: a.mimeType,
      fileSizeBytes: a.fileSizeBytes,
      status: a.status,
      leadMagnetSlug: a.leadMagnetSlug,
      placements: a.placements,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
    return NextResponse.json({ assets: serialized });
  } catch (error: unknown) {
    console.error("List funnel content assets error:", error);
    return NextResponse.json({ error: "Failed to list assets" }, { status: 500 });
  }
}
