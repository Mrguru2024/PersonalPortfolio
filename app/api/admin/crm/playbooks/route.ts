import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/playbooks?activeOnly=true — list sales playbooks. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") !== "false";
    const list = await storage.getCrmSalesPlaybooks(activeOnly);
    return NextResponse.json({ playbooks: list });
  } catch (error: unknown) {
    console.error("Playbooks GET error:", error);
    return NextResponse.json({ error: "Failed to load playbooks" }, { status: 500 });
  }
}
