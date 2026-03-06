import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { message: "Please sign in first." },
        { status: 401 }
      );
    }

    if (user.isAdmin === true) {
      return NextResponse.json({
        message: "Your account already has admin publishing access.",
      });
    }

    if (user.role === "developer" && user.adminApproved === true) {
      return NextResponse.json({
        message: "You already have approved developer contributor access.",
      });
    }

    await storage.updateUser(user.id, {
      role: "developer",
      adminApproved: false,
      isAdmin: false,
    });

    return NextResponse.json({
      message:
        "Contributor request submitted. An admin must approve your developer account before you can submit posts.",
    });
  } catch (error) {
    console.error("Error in POST /api/blog/contributor-request:", error);
    return NextResponse.json(
      { message: "Failed to submit contributor request." },
      { status: 500 }
    );
  }
}
