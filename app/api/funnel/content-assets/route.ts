import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/funnel/content-assets?pagePath=/digital-growth-audit&sectionId=lead_magnet_download — public: published assets for placement */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pagePath = searchParams.get("pagePath");
    const sectionId = searchParams.get("sectionId");
    if (!pagePath || !sectionId) {
      return NextResponse.json(
        { error: "pagePath and sectionId are required" },
        { status: 400 }
      );
    }
    const assets = await storage.getFunnelContentAssetsByPlacement(pagePath, sectionId);
    const serialized = assets.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      assetType: a.assetType,
      fileUrl: a.fileUrl,
      mimeType: a.mimeType,
    }));
    return NextResponse.json({ assets: serialized });
  } catch (error: unknown) {
    console.error("Get funnel content assets by placement error:", error);
    return NextResponse.json({ error: "Failed to get assets" }, { status: 500 });
  }
}
