import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { cookies } from "next/headers";

// Optimized for serverless - fast response, minimal logging
export async function GET(req: NextRequest) {
  try {
    // Check for session cookie first (fast check)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("sessionId") || cookieStore.get("connect.sid");
    
    if (!sessionCookie) {
      // No cookie - definitely not authenticated
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fast timeout for serverless (2 seconds max)
    const userPromise = getSessionUser(req);
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), 2000)
    );
    
    const user = await Promise.race([userPromise, timeoutPromise]);
    
    if (!user) {
      // Cookie exists but session lookup failed - return 401
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Don't send password
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    // Handle all errors gracefully - return 401 instead of 500
    // This prevents error logs for expected authentication failures
    return NextResponse.json(
      { message: "Not authenticated" },
      { status: 401 }
    );
  }
}
