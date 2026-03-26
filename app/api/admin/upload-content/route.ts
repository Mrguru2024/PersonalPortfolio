import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { storage } from "@server/storage";
import { ADMIN_VIDEO_MIME_TO_EXT } from "@shared/adminMediaMimes";

export const dynamic = "force-dynamic";

const MAX_SIZE = 80 * 1024 * 1024; // 80MB

const VIDEO_MIME_MAP = Object.fromEntries(
  Object.entries(ADMIN_VIDEO_MIME_TO_EXT).map(([mime, ext]) => [mime, { ext, kind: "video" as const }])
) as Record<string, { ext: string; kind: "video" }>;

/** MIME → extension + file kind for validation against chosen assetType */
const MIME_MAP: Record<string, { ext: string; kind: "pdf" | "pptx" | "video" | "image" }> = {
  ...VIDEO_MIME_MAP,
  "application/pdf": { ext: "pdf", kind: "pdf" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { ext: "pptx", kind: "pptx" },
  "application/vnd.ms-powerpoint": { ext: "ppt", kind: "pptx" },
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/png": { ext: "png", kind: "image" },
  "image/gif": { ext: "gif", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" },
  "image/svg+xml": { ext: "svg", kind: "image" },
};

const ASSET_TYPES = ["pdf", "pptx", "video", "slideshow", "image", "auto"] as const;

function assetTypesAllowedForKind(kind: (typeof MIME_MAP)[string]["kind"]): readonly string[] {
  switch (kind) {
    case "pdf":
      return ["pdf", "auto"];
    case "pptx":
      return ["pptx", "slideshow", "auto"];
    case "video":
      return ["video", "auto"];
    case "image":
      return ["image", "auto"];
    default:
      return [];
  }
}

/** Map detected file kind → stored assetType (slideshow shares PPTX MIME). */
function inferAssetTypeFromKind(kind: (typeof MIME_MAP)[string]["kind"]): "pdf" | "pptx" | "video" | "image" {
  if (kind === "pptx") return "pptx";
  if (kind === "pdf") return "pdf";
  if (kind === "video") return "video";
  return "image";
}

/** POST /api/admin/upload-content — admin upload (PDF, PPTX, video, images). Creates draft asset. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const formData = await req.formData();
    const file = formData.get("file") ?? formData.get("media");
    const title = (formData.get("title") as string)?.trim() ?? "Untitled";
    let assetTypeRaw = ((formData.get("assetType") as string) ?? "auto").toLowerCase().trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const leadMagnetSlug = (formData.get("leadMagnetSlug") as string)?.trim() || null;
    const accessLevelRaw = (formData.get("accessLevel") as string)?.toLowerCase() ?? "public";
    const accessLevel = accessLevelRaw === "registered" ? "registered" : "public";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file. Use form field 'file' or 'media'." }, { status: 400 });
    }
    if (!ASSET_TYPES.includes(assetTypeRaw as (typeof ASSET_TYPES)[number])) {
      return NextResponse.json(
        { error: "Invalid assetType. Use: pdf, pptx, video, slideshow, image, or auto." },
        { status: 400 }
      );
    }
    const mapped = MIME_MAP[file.type];
    if (!mapped) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Allowed: PDF, PPTX/PPT, common video (MP4, WebM, MOV, AVI, OGV, 3GP, MKV, WMV), JPEG, PNG, GIF, WebP, SVG.",
        },
        { status: 400 }
      );
    }
    const allowedTypes = assetTypesAllowedForKind(mapped.kind);
    if (!allowedTypes.includes(assetTypeRaw)) {
      return NextResponse.json(
        { error: `This file does not match selected type "${assetTypeRaw}". Choose Auto-detect or the correct type.` },
        { status: 400 }
      );
    }
    if (assetTypeRaw === "auto") {
      assetTypeRaw = inferAssetTypeFromKind(mapped.kind);
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Max 80MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${randomUUID()}.${mapped.ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "content");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    const fileUrl = `/uploads/content/${filename}`;

    const assetType = assetTypeRaw as "pdf" | "pptx" | "video" | "slideshow" | "image";

    const asset = await storage.createFunnelContentAsset({
      title,
      description,
      assetType,
      fileUrl,
      mimeType: file.type,
      fileSizeBytes: file.size,
      status: "draft",
      accessLevel,
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
        accessLevel: asset.accessLevel,
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
