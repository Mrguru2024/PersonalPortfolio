import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

// Get newsletter by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const newsletter = await storage.getNewsletterById(id);
    
    if (!newsletter) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }
    
    return NextResponse.json(newsletter);
  } catch (error: any) {
    console.error("Error fetching newsletter:", error);
    return NextResponse.json({ error: "Failed to fetch newsletter" }, { status: 500 });
  }
}

// Update newsletter
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
    
    const newsletter = await storage.updateNewsletter(id, body);
    return NextResponse.json(newsletter);
  } catch (error: any) {
    console.error("Error updating newsletter:", error);
    return NextResponse.json({ error: "Failed to update newsletter" }, { status: 500 });
  }
}

// Delete newsletter
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
    
    await storage.deleteNewsletter(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting newsletter:", error);
    return NextResponse.json({ error: "Failed to delete newsletter" }, { status: 500 });
  }
}
