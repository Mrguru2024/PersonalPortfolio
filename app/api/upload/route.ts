import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { optimizeImageBuffer } from "@server/services/imageOptimization";
import {
  ADMIN_VIDEO_MIME_TO_EXT,
  MAX_ADMIN_INLINE_UPLOAD_IMAGE_BYTES,
  MAX_ADMIN_INLINE_UPLOAD_VIDEO_BYTES,
} from "@shared/adminMediaMimes";

export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/** POST /api/upload — admin media upload. Form field: file | media | image. Images optimized to WebP/JPEG/PNG; video stored as-is. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const formData = await req.formData();
    const file = formData.get("file") ?? formData.get("media") ?? formData.get("image");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Use form field 'file', 'media', or 'image'." },
        { status: 400 }
      );
    }

    const videoExt = ADMIN_VIDEO_MIME_TO_EXT[file.type];
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

    if (!isImage && !videoExt) {
      return NextResponse.json(
        {
          error:
            "Invalid type. Allowed images: JPEG, PNG, GIF, WebP. Allowed video: MP4, WebM, MOV, AVI, OGV, 3GP, MKV, WMV.",
        },
        { status: 400 }
      );
    }

    const maxSize = videoExt ? MAX_ADMIN_INLINE_UPLOAD_VIDEO_BYTES : MAX_ADMIN_INLINE_UPLOAD_IMAGE_BYTES;
    if (file.size > maxSize) {
      const mb = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json({ error: `File too large. Max ${mb}MB for ${videoExt ? "video" : "images"}.` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);
    let buffer: Buffer;
    let ext: string;
    if (videoExt) {
      buffer = inputBuffer;
      ext = `.${videoExt}`;
    } else {
      const out = await optimizeImageBuffer(inputBuffer, file.type);
      buffer = out.buffer;
      ext = out.ext;
    }
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url, filename });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
