import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const contactId = Number((await params).id);
    if (!Number.isFinite(contactId)) {
      return NextResponse.json({ error: "Invalid contact id" }, { status: 400 });
    }
    const contact = await storage.getCrmContactById(contactId);
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    const suggestions = await storage.listCrmContactSocialSuggestions(contactId);
    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load suggestions" }, { status: 500 });
  }
}
