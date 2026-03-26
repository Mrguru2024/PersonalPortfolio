import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { BRAND_TEMP_RETENTION_DAYS } from "@shared/brandVaultSchema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 50 * 1024 * 1024;

const DOCUMENT_MIMES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const IMAGE_MIMES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

function extForUpload(folderKind: string, mime: string): string | undefined {
  if (folderKind === "images") return IMAGE_MIMES[mime];
  return DOCUMENT_MIMES[mime];
}

/** POST /api/admin/brand-vault/folders/[id]/upload — multipart field "file" */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { id: idParam } = await params;
    const folderId = Number.parseInt(idParam, 10);
    if (Number.isNaN(folderId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const folder = await storage.getBrandTempFolderById(folderId);
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file (use form field 'file')" }, { status: 400 });
    }
    const ext = extForUpload(folder.folderKind, file.type);
    if (!ext) {
      return NextResponse.json(
        {
          error:
            folder.folderKind === "images"
              ? "Unsupported image type. Use JPEG, PNG, GIF, WebP, or SVG."
              : "Unsupported document type. Use PDF, Word, PowerPoint, TXT, CSV, or XLSX.",
        },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeBase = randomUUID();
    const filename = `${safeBase}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "brand-temp", String(folderId));
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    const publicPath = `/uploads/brand-temp/${folderId}/${filename}`;

    const originalFilename = file.name?.trim() || filename;
    const expiresAt = new Date(Date.now() + BRAND_TEMP_RETENTION_DAYS * 86_400_000);
    const row = await storage.createBrandTempFile({
      folderId,
      originalFilename,
      publicPath,
      mimeType: file.type,
      sizeBytes: file.size,
      expiresAt,
    });

    return NextResponse.json(row);
  } catch (e) {
    console.error("[brand-vault/upload POST]", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
