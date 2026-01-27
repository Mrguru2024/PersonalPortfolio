import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Session management for Next.js App Router
export async function getSessionUser(req?: NextRequest): Promise<any | null> {
  try {
    // Try to get user from API endpoint
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("connect.sid");
    
    if (!sessionCookie) {
      return null;
    }

    // Make a request to the user endpoint to get current user
    const baseUrl = req?.nextUrl?.origin || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/user`, {
      headers: {
        Cookie: `connect.sid=${sessionCookie.value}`,
      },
      cache: "no-store",
    });

    if (response.ok) {
      const user = await response.json();
      return user;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting session user:", error);
    return null;
  }
}

export async function setSession(req: NextRequest, user: any): Promise<NextResponse> {
  // Session is handled server-side via Express session
  // This is a placeholder for Next.js compatibility
  const response = NextResponse.json(user);
  return response;
}

export async function deleteSession(): Promise<NextResponse> {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.delete("connect.sid");
  return response;
}

// Check if user is admin
export async function isAdmin(req?: NextRequest): Promise<boolean> {
  const user = await getSessionUser(req);
  return user !== null && user.isAdmin === true;
}

// Check if user is admin or approved writer
export async function canCreateBlog(req?: NextRequest): Promise<boolean> {
  const user = await getSessionUser(req);
  if (!user) return false;
  
  // Allow admin or users with role "writer" or "admin"
  return user.isAdmin === true || user.role === "writer" || user.role === "admin";
}

// Check if user has a specific role
export async function hasRole(req: NextRequest | undefined, role: string): Promise<boolean> {
  const user = await getSessionUser(req);
  if (!user) return false;
  
  return user.role === role || user.isAdmin === true; // Admins have all roles
}

// Get IP address from request
export function getIpAddress(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return "127.0.0.1";
}
