import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** POST /api/admin/crm/alerts/[id]/read — mark alert as read. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    await storage.markCrmAlertRead(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("CRM alert read error:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
