import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/funnel-content-assets/[id] */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(_req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const asset = await storage.getFunnelContentAssetById(id);
    if (!asset) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: asset.id,
      title: asset.title,
      description: asset.description,
      assetType: asset.assetType,
      fileUrl: asset.fileUrl,
      mimeType: asset.mimeType,
      fileSizeBytes: asset.fileSizeBytes,
      status: asset.status,
      leadMagnetSlug: asset.leadMagnetSlug,
      placements: asset.placements,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    });
  } catch (error: unknown) {
    console.error("Get funnel content asset error:", error);
    return NextResponse.json({ error: "Failed to get asset" }, { status: 500 });
  }
}

/** PATCH /api/admin/funnel-content-assets/[id] — update title, description, status, leadMagnetSlug, placements */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await req.json();
    const updates: {
      title?: string;
      description?: string | null;
      status?: string;
      leadMagnetSlug?: string | null;
      placements?: Array<{ pagePath: string; sectionId: string }>;
    } = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() : null;
    if (body.status === "draft" || body.status === "published") updates.status = body.status;
    if (body.leadMagnetSlug !== undefined) updates.leadMagnetSlug = body.leadMagnetSlug ? String(body.leadMagnetSlug).trim() : null;
    if (Array.isArray(body.placements)) {
      updates.placements = body.placements.filter(
        (p: unknown): p is { pagePath: string; sectionId: string } =>
          typeof p === "object" && p !== null && "pagePath" in p && "sectionId" in p
      );
    }
    const asset = await storage.updateFunnelContentAsset(id, updates);
    return NextResponse.json({
      id: asset.id,
      title: asset.title,
      description: asset.description,
      assetType: asset.assetType,
      fileUrl: asset.fileUrl,
      mimeType: asset.mimeType,
      fileSizeBytes: asset.fileSizeBytes,
      status: asset.status,
      leadMagnetSlug: asset.leadMagnetSlug,
      placements: asset.placements,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    });
  } catch (error: unknown) {
    console.error("Update funnel content asset error:", error);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

/** DELETE /api/admin/funnel-content-assets/[id] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(_req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await storage.deleteFunnelContentAsset(id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Delete funnel content asset error:", error);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}
