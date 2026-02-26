import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Check admin access
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const requests = await storage.getAllResumeRequests();
    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("Error fetching resume requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch resume requests" },
      { status: 500 }
    );
  }
}
