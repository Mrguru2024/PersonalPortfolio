import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

// Update subscriber
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await req.json();
    
    const subscriber = await storage.updateSubscriber(id, body);
    return NextResponse.json(subscriber);
  } catch (error: any) {
    console.error("Error updating subscriber:", error);
    return NextResponse.json({ error: "Failed to update subscriber" }, { status: 500 });
  }
}

// Delete subscriber
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    await storage.deleteSubscriber(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting subscriber:", error);
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 });
  }
}
