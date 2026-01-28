import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

/**
 * GET /api/admin/users
 * Get all users (requires admin approval)
 */
export async function GET(req: NextRequest) {
  try {
    // Check if requester is an approved admin
    const requesterIsAdmin = await isAdmin(req);
    if (!requesterIsAdmin) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    // Get all users from database
    // Note: This is a simple implementation - you may want to add pagination
    const { db } = await import("@server/db");
    const { users } = await import("@shared/schema");
    
    const allUsers = await db.select().from(users);

    // Remove passwords from response
    const usersWithoutPasswords = allUsers.map(({ password, ...user }) => user);

    return NextResponse.json(usersWithoutPasswords);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Error fetching users" },
      { status: 500 }
    );
  }
}
