import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { storage } from "@server/storage";

// Session management for Next.js App Router
// Optimized for serverless environments with fast timeouts
export async function getSessionUser(req?: NextRequest): Promise<any | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("sessionId") || cookieStore.get("connect.sid");
    
    if (!sessionCookie) {
      // Fast return - no cookie means not authenticated
      return null;
    }

    // Get session from session store directly (avoid circular dependency)
    return new Promise((resolve) => {
      // connect-pg-simple stores sessions with the session ID as-is
      const sessionId = sessionCookie.value;
      
      // Fast timeout for serverless (1.5 seconds max)
      const timeout = setTimeout(() => {
        resolve(null);
      }, 1500);
      
      storage.sessionStore.get(sessionId, async (err, session) => {
        clearTimeout(timeout);
        
        if (err) {
          // Ignore ENOENT errors for table.sql - this is a known connect-pg-simple issue
          if (err.code === 'ENOENT' && (err.path?.includes('table.sql') || err.path?.includes('connect-pg-simple'))) {
            resolve(null);
            return;
          }
          
          // Handle database connection errors gracefully in serverless
          if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
            resolve(null);
            return;
          }
          
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
          // Get user from database with timeout for serverless
          const userIdNum = typeof userId === 'number' ? userId : Number.parseInt(String(userId), 10);
          
          // Add timeout for database query in serverless environments
          const userPromise = storage.getUser(userIdNum);
          const timeoutPromise = new Promise<null>((resolve) => 
            setTimeout(() => resolve(null), 3000)
          );
          
          const user = await Promise.race([userPromise, timeoutPromise]);
          
          if (!user) {
            console.log("getSessionUser: User not found in database for ID:", userIdNum);
            resolve(null);
            return;
          }

          console.log("getSessionUser: User found:", user.id, user.username);
          // Don't send password
          const { password, ...userWithoutPassword } = user;
          resolve(userWithoutPassword);
        } catch (error: any) {
          // Handle database connection errors gracefully
          if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
            console.warn("getSessionUser: Database connection error (serverless?), returning null:", error.code);
          } else {
            console.error("getSessionUser: Error fetching user from database:", error);
          }
          // Silently fail - not authenticated
          resolve(null);
        }
      });
    });
  } catch (error) {
    // Silently fail - not authenticated (don't log in production)
    return null;
  }
}

export function setSession(sessionId: string, userId: number): Promise<void> {
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

  // Set session with callback and return a promise
  // Optimized for serverless - fast timeout, minimal logging
  return new Promise((resolve) => {
    // Fast timeout for serverless (1 second max)
    const timeout = setTimeout(() => {
      // Don't reject - allow login to continue even if session storage fails
      // The cookie is set, so the session can be stored on next request
      resolve();
    }, 1000);
    
    try {
      storage.sessionStore.set(sessionId, sessionData, (err) => {
        clearTimeout(timeout);
        
        if (err) {
          // Handle all errors gracefully - don't block login
          // The cookie is set, so the session can be stored on next request
          resolve();
        } else {
          resolve();
        }
      });
    } catch (error: any) {
      clearTimeout(timeout);
      // Don't reject - allow login to continue
      resolve();
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

// Check if user is admin (requires both isAdmin flag AND admin approval)
export async function isAdmin(req?: NextRequest): Promise<boolean> {
  const user = await getSessionUser(req);
  return user !== null && user.isAdmin === true && user.adminApproved === true;
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
  
  // Admins (with approval) have all roles
  return user.role === role || (user.isAdmin === true && user.adminApproved === true);
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
