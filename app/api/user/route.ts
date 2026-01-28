import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/user - Checking authentication");
    const user = await getSessionUser(req);
    
    if (!user) {
      console.log("GET /api/user - No user found, returning 401");
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    console.log("GET /api/user - User authenticated:", user.id, user.username);
    // Don't send password
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error in GET /api/user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
