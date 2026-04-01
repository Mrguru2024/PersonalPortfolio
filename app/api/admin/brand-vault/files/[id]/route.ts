import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** DELETE /api/admin/brand-vault/files/[id] */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { id: idParam } = await params;
    const id = Number.parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const file = await storage.getBrandTempFileById(id);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    await storage.deleteBrandTempFile(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[brand-vault/files/[id] DELETE]", e);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
