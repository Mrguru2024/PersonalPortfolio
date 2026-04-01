import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/brand-vault/folders */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const folders = await storage.listBrandTempFolders();
    return NextResponse.json(folders);
  } catch (e) {
    console.error("[brand-vault/folders GET]", e);
    return NextResponse.json({ error: "Failed to list folders" }, { status: 500 });
  }
}

/** POST /api/admin/brand-vault/folders — { name, folderKind?: "documents" | "images" } */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const rawKind = typeof body.folderKind === "string" ? body.folderKind.toLowerCase().trim() : "documents";
    const folderKind = rawKind === "images" ? "images" : "documents";
    const folder = await storage.createBrandTempFolder({
      name,
      folderKind,
      createdByUserId: userId ?? undefined,
    });
    return NextResponse.json(folder);
  } catch (e) {
    console.error("[brand-vault/folders POST]", e);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
