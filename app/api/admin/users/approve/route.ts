import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

/**
 * POST /api/admin/users/approve
 * Approve a user for admin access (requires admin approval)
 */
export async function POST(req: NextRequest) {
  try {
    // Check if requester is an approved admin
    const requesterIsAdmin = await isAdmin(req);
    if (!requesterIsAdmin) {
      return NextResponse.json(
        { message: "Admin access required" },
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

    // Get the user to approve
    const user = await storage.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Only approve users who have isAdmin set to true
    if (!user.isAdmin) {
      return NextResponse.json(
        { message: "User must have isAdmin flag set to true before approval" },
        { status: 400 }
      );
    }

    // Approve the user
    const updatedUser = await storage.updateUser(userId, {
      adminApproved: true,
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
