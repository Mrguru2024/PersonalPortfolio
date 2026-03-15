import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

/**
 * GET /api/admin/users
 * List all users (super user only; for approving founders and managing privileges)
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { message: "Super user access required" },
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
