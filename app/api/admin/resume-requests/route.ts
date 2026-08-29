import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";

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

    // TODO: Implement getAllResumeRequests method in storage
    // For now, return empty array to unblock build
    const requests: any[] = [];
    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("Error fetching resume requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch resume requests" },
      { status: 500 }
    );
  }
}
