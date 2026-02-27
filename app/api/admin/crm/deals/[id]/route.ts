import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

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
    const deal = await storage.updateCrmDeal(id, body);
    return NextResponse.json(deal);
  } catch (error: any) {
    console.error("Error updating CRM deal:", error);
    return NextResponse.json({ error: "Failed to update CRM deal" }, { status: 500 });
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
    await storage.deleteCrmDeal(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting CRM deal:", error);
    return NextResponse.json({ error: "Failed to delete CRM deal" }, { status: 500 });
  }
}
