import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const contact = await storage.getCrmContactById(id);
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const events = await storage.getDocumentEventsByLeadId(id);
    return NextResponse.json(events);
  } catch (error: any) {
    console.error("CRM document events error:", error);
    return NextResponse.json({ error: "Failed to load document events" }, { status: 500 });
  }
}
