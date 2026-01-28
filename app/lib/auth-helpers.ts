import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { storage } from "@server/storage";

// Session management for Next.js App Router
export async function getSessionUser(req?: NextRequest): Promise<any | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("sessionId") || cookieStore.get("connect.sid");
    
    if (!sessionCookie) {
      return null;
    }

    // Get session from session store directly (avoid circular dependency)
    return new Promise((resolve) => {
      // connect-pg-simple stores sessions with the session ID as-is
      const sessionId = sessionCookie.value;
      
      storage.sessionStore.get(sessionId, async (err, session) => {
        if (err) {
          // Silently fail - session not found or error
          resolve(null);
          return;
        }

        if (!session) {
          // Session doesn't exist or expired
          resolve(null);
          return;
        }

        // Session data structure: connect-pg-simple stores the session object as-is
        // Check various possible structures for userId
        const userId = (session as any).userId || (session as any).passport?.user || (session as any).user?.id;
        
        if (!userId) {
          // No userId in session
          resolve(null);
          return;
        }

        try {
          // Get user from database
          const userIdNum = typeof userId === 'number' ? userId : Number.parseInt(String(userId), 10);
          const user = await storage.getUser(userIdNum);
          
          if (!user) {
            resolve(null);
            return;
          }

          // Don't send password
          const { password, ...userWithoutPassword } = user;
          resolve(userWithoutPassword);
        } catch (error) {
          // Silently fail - not authenticated
          resolve(null);
        }
      });
    });
  } catch (error) {
    // Silently fail - not authenticated
    return null;
  }
}

export function setSession(sessionId: string, userId: number): void {
  // Store session in session store
  // connect-pg-simple expects the session data to match express-session format
  const sessionData = {
    userId,
    cookie: {
      originalMaxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };

  // Set session with callback
  storage.sessionStore.set(sessionId, sessionData, (err) => {
    if (err) {
      console.error("Error storing session:", err);
    }
  });
}

export function deleteSession(sessionId: string): void {
  // Destroy session in session store
  storage.sessionStore.destroy(sessionId, (err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
  });
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
