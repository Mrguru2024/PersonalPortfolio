import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { cookies } from "next/headers";

// Optimized for serverless - fast response with diagnostic logging
export async function GET(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "unknown";
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  
  try {
    // Check for session cookie first (fast check)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("sessionId") || cookieStore.get("connect.sid");
    
    if (!sessionCookie) {
      // No cookie - definitely not authenticated
      if (isMobile) {
        console.log(`[GET /api/user] No session cookie found (Mobile: ${userAgent.substring(0, 50)})`);
      }
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (isMobile) {
      console.log(`[GET /api/user] Cookie found: ${sessionCookie.name}, length: ${sessionCookie.value?.length || 0} (Mobile)`);
    }

    // Fast timeout for serverless (2 seconds max)
    const startTime = Date.now();
    const userPromise = getSessionUser(req);
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => {
        if (isMobile) {
          console.log(`[GET /api/user] Session lookup timeout after ${Date.now() - startTime}ms (Mobile)`);
        }
        resolve(null);
      }, 2000)
    );
    
    const user = await Promise.race([userPromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    if (!user) {
      // Cookie exists but session lookup failed - return 401
      if (isMobile) {
        console.log(`[GET /api/user] Session lookup failed (cookie exists but no user found) after ${duration}ms (Mobile)`);
      }
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (isMobile) {
      console.log(`[GET /api/user] Success: User ${user.id} authenticated in ${duration}ms (Mobile)`);
    }

    // Don't send password
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    // Handle all errors gracefully - return 401 instead of 500
    if (isMobile) {
      console.error(`[GET /api/user] Error: ${error?.message || 'Unknown error'} (Mobile)`);
    }
    return NextResponse.json(
      { message: "Not authenticated" },
      { status: 401 }
    );
  }
}
