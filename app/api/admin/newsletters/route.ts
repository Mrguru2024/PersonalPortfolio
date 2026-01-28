import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

// Get all newsletters
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    
    const newsletters = await storage.getAllNewsletters();
    return NextResponse.json(newsletters);
  } catch (error: any) {
    console.error("Error fetching newsletters:", error);
    return NextResponse.json({ error: "Failed to fetch newsletters" }, { status: 500 });
  }
}

// Create new newsletter
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    
    const body = await req.json();
    const newsletter = await storage.createNewsletter(body);
    return NextResponse.json(newsletter, { status: 201 });
  } catch (error: any) {
    console.error("Error creating newsletter:", error);
    return NextResponse.json({ error: "Failed to create newsletter" }, { status: 500 });
  }
}
