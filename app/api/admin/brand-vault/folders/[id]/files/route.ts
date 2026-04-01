import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/brand-vault/folders/[id]/files */
export async function GET(
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
    const files = await storage.listBrandTempFilesByFolderId(folderId);
    return NextResponse.json(files);
  } catch (e) {
    console.error("[brand-vault/folders/[id]/files GET]", e);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}
