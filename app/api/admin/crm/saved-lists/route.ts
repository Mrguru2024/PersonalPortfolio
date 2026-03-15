import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/crm/saved-lists */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const lists = await storage.getCrmSavedLists();
    return NextResponse.json(lists);
  } catch (error: any) {
    console.error("CRM saved lists error:", error);
    return NextResponse.json({ error: "Failed to load saved lists" }, { status: 500 });
  }
}

/** POST /api/admin/crm/saved-lists — create saved list */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const list = await storage.createCrmSavedList({
      name: body.name,
      filters: body.filters ?? {},
      createdById: body.createdById ?? null,
    });
    return NextResponse.json(list);
  } catch (error: any) {
    console.error("CRM saved list create error:", error);
    return NextResponse.json({ error: "Failed to create saved list" }, { status: 500 });
  }
}
