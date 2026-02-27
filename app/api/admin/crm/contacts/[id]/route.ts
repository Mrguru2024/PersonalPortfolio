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
    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("Error fetching CRM contact:", error);
    return NextResponse.json({ error: "Failed to fetch CRM contact" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json();
    const contact = await storage.updateCrmContact(id, body);
    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("Error updating CRM contact:", error);
    return NextResponse.json({ error: "Failed to update CRM contact" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    await storage.deleteCrmContact(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting CRM contact:", error);
    return NextResponse.json({ error: "Failed to delete CRM contact" }, { status: 500 });
  }
}
