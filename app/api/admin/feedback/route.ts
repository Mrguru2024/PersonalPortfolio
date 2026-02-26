import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }
    const feedback = await storage.getAllClientFeedback();
    return NextResponse.json(feedback);
  } catch (error: unknown) {
    console.error("Error fetching feedback:", error);
    const details =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : undefined;
    return NextResponse.json(
      { error: "Failed to fetch feedback", ...(details && { details }) },
      { status: 500 }
    );
  }
}
