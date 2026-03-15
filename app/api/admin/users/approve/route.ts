import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

/**
 * POST /api/admin/users/approve
 * Approve a founder for admin access (super user only)
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { message: "Super user access required" },
        { status: 403 }
      );
    }

    const { userId } = await req.json();

    if (!userId || typeof userId !== "number") {
      return NextResponse.json(
        { message: "Valid userId is required" },
        { status: 400 }
      );
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.isAdmin) {
      return NextResponse.json(
        { message: "User must have isAdmin flag set to true before approval" },
        { status: 400 }
      );
    }

    // Approve and ensure role is admin (founder), never developer
    const updatedUser = await storage.updateUser(userId, {
      adminApproved: true,
      role: user.role === "developer" ? "developer" : "admin",
    });

    // Don't send password
    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error approving user:", error);
    return NextResponse.json(
      { message: "Error approving user" },
      { status: 500 }
    );
  }
}
