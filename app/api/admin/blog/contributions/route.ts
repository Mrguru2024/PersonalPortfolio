import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required." },
        { status: 403 }
      );
    }

    const status = req.nextUrl.searchParams.get("status");
    const reviewed =
      status === "pending"
        ? false
        : status === "reviewed"
          ? true
          : undefined;

    const contributions = await storage.getBlogPostContributions(reviewed);
    return NextResponse.json(contributions);
  } catch (error) {
    console.error("Error in GET /api/admin/blog/contributions:", error);
    return NextResponse.json(
      { message: "Failed to fetch contributor submissions." },
      { status: 500 }
    );
  }
}
