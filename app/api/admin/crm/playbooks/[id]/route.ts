import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/playbooks/[id] — get one sales playbook. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const playbook = await storage.getCrmSalesPlaybookById(id);
    if (!playbook) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(playbook);
  } catch (error: unknown) {
    console.error("Playbook [id] GET error:", error);
    return NextResponse.json({ error: "Failed to load playbook" }, { status: 500 });
  }
}
