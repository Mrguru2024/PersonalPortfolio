import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_PREFIX = "/uploads/content/";

function resolveSafeContentFilePath(fileUrl: string): string | null {
  if (!fileUrl.startsWith(UPLOAD_PREFIX)) return null;
  const relative = fileUrl.slice(UPLOAD_PREFIX.length);
  if (!relative || relative.includes("..") || relative.includes("\\") || relative.includes("/")) {
    return null;
  }
  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads", "content");
  const full = path.resolve(uploadsRoot, relative);
  if (!full.startsWith(uploadsRoot + path.sep) && full !== uploadsRoot) {
    return null;
  }
  return full;
}

const MIME_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/vnd.ms-powerpoint": ".ppt",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "video/x-msvideo": ".avi",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

/** Prefer a readable name from title + original extension; fall back to stored filename. */
function downloadFilename(title: string, fileUrl: string, mimeType: string | null): string {
  const fromUrl = path.extname(fileUrl.split("?")[0] || "");
  const ext = fromUrl || MIME_EXT[mimeType?.trim().toLowerCase() ?? ""] || "";
  const cleaned = title
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .slice(0, 120)
    .trim();
  const fromTitle =
    cleaned
      .replace(/\s+/g, "-")
      .replace(/[^\w.\-()+&,]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^[-_.]+|[-_.]+$/g, "") || "";
  const fileStem = (fileUrl.split("/").pop() ?? "download").replace(/\.[^.]+$/, "");
  const stem =
    fromTitle ||
    fileStem.replace(/[^\w.\-()+ ]/g, "_").replace(/_+/g, "_") ||
    "download";
  return `${stem}${ext}`;
}

/** GET /api/user/free-offers/[id]/download — stream file for signed-in users only. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Sign in required" }, { status: 401 });
    }

    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const asset = await storage.getFunnelContentAssetById(id);
    if (!asset || asset.status !== "published" || asset.accessLevel !== "registered") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const diskPath = resolveSafeContentFilePath(asset.fileUrl);
    if (!diskPath) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    let buffer: Buffer;
    try {
      buffer = await readFile(diskPath);
    } catch {
      return NextResponse.json({ error: "File missing" }, { status: 404 });
    }

    const downloadName = downloadFilename(asset.title, asset.fileUrl, asset.mimeType).replace(/"/g, "'");
    const contentType = asset.mimeType?.trim() || "application/octet-stream";

    const body = new Uint8Array(buffer);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: unknown) {
    console.error("Free offer download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
