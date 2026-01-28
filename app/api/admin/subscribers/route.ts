import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

// Get all subscribers
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    
    const includeUnsubscribed = req.nextUrl.searchParams.get("includeUnsubscribed") === "true";
    const subscribers = await storage.getAllSubscribers(includeUnsubscribed);
    return NextResponse.json(subscribers);
  } catch (error: any) {
    console.error("Error fetching subscribers:", error);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

// Create new subscriber
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    
    const body = await req.json();
    const subscriber = await storage.createSubscriber(body);
    return NextResponse.json(subscriber, { status: 201 });
  } catch (error: any) {
    console.error("Error creating subscriber:", error);
    return NextResponse.json({ error: "Failed to create subscriber" }, { status: 500 });
  }
}
