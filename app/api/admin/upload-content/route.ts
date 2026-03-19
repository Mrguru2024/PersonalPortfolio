import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

const MAX_SIZE = 80 * 1024 * 1024; // 80MB for video/PDF
const ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const ASSET_TYPES = ["pdf", "pptx", "video", "slideshow"] as const;

/** POST /api/admin/upload-content — admin upload for funnel (PDF, PPTX, video). Creates asset as draft. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const formData = await req.formData();
    const file = formData.get("file") ?? formData.get("media");
    const title = (formData.get("title") as string)?.trim() ?? "Untitled";
    const assetType = (formData.get("assetType") as string)?.toLowerCase();
    const description = (formData.get("description") as string)?.trim() || null;
    const leadMagnetSlug = (formData.get("leadMagnetSlug") as string)?.trim() || null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file. Use form field 'file' or 'media'." }, { status: 400 });
    }
    if (!assetType || !ASSET_TYPES.includes(assetType as (typeof ASSET_TYPES)[number])) {
      return NextResponse.json(
        { error: "Invalid assetType. Use: pdf, pptx, video, slideshow." },
        { status: 400 }
      );
    }
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, PPTX, MP4, WebM, MOV." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Max 80MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "content");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    const fileUrl = `/uploads/content/${filename}`;

    const asset = await storage.createFunnelContentAsset({
      title,
      description,
      assetType: assetType as "pdf" | "pptx" | "video" | "slideshow",
      fileUrl,
      mimeType: file.type,
      fileSizeBytes: file.size,
      status: "draft",
      leadMagnetSlug,
      placements: [],
    });

    return NextResponse.json({
      asset: {
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
      },
    });
  } catch (error: unknown) {
    console.error("Upload content error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
