import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { storage } from "@server/storage";

// Session management for Next.js App Router
// Optimized for serverless environments with fast timeouts
export async function getSessionUser(req?: NextRequest): Promise<any | null> {
  const userAgent = req?.headers.get("user-agent") || "unknown";
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

  try {
    const cookieStore = await cookies();
    let sessionId: string | undefined =
      cookieStore.get("sessionId")?.value ??
      cookieStore.get("connect.sid")?.value;

    // Fallback: read Cookie header from request (fixes 401 when cookies() context is missing in serverless)
    if (!sessionId && req?.headers.get("cookie")) {
      const cookieHeader = req.headers.get("cookie") ?? "";
      const match = cookieHeader.match(
        /(?:^|;\s*)(?:sessionId|connect\.sid)=([^;]+)/,
      );
      if (match) sessionId = match[1].trim();
    }

    if (!sessionId) {
      return null;
    }

    // Get session from session store directly (avoid circular dependency)
    return new Promise((resolve) => {
      // connect-pg-simple stores sessions with the session ID as-is
      const storeStartTime = Date.now();

      // Increased timeout slightly for mobile/network latency (2 seconds)
      const timeout = setTimeout(() => {
        const storeDuration = Date.now() - storeStartTime;
        if (isMobile) {
          console.log(
            `[getSessionUser] Session store get timeout after ${storeDuration}ms (Mobile)`,
          );
        }
        resolve(null);
      }, 2000);

      storage.sessionStore.get(sessionId, async (err, session) => {
        clearTimeout(timeout);
        const storeDuration = Date.now() - storeStartTime;

        if (err) {
          // Ignore ENOENT errors for table.sql - this is a known connect-pg-simple issue
          if (
            err.code === "ENOENT" &&
            (err.path?.includes("table.sql") ||
              err.path?.includes("connect-pg-simple"))
          ) {
            if (isMobile) {
              console.log(
                `[getSessionUser] ENOENT error (table.sql) after ${storeDuration}ms (Mobile)`,
              );
            }
            resolve(null);
            return;
          }

          // Handle database connection errors gracefully in serverless
          if (
            err.code === "ECONNREFUSED" ||
            err.code === "ETIMEDOUT" ||
            err.message?.includes("timeout")
          ) {
            if (isMobile) {
              console.log(
                `[getSessionUser] DB connection error: ${err.code} after ${storeDuration}ms (Mobile)`,
              );
            }
            resolve(null);
            return;
          }

          // Log other errors for mobile debugging
          if (isMobile) {
            console.error(
              `[getSessionUser] Session store error: ${err.message || err.code} after ${storeDuration}ms (Mobile)`,
            );
          }
          resolve(null);
          return;
        }

        if (!session) {
          // Session doesn't exist or expired
          console.log(
            `[getSessionUser] Session not found in store for sessionId ${sessionId.substring(0, 16)}... after ${storeDuration}ms${isMobile ? " (Mobile)" : ""}`,
          );
          resolve(null);
          return;
        }

        // Session data structure: connect-pg-simple stores the session object as-is
        // Check various possible structures for userId
        const userId =
          (session as any).userId ||
          (session as any).passport?.user ||
          (session as any).user?.id;

        if (!userId) {
          // No userId in session
          console.log(
            `[getSessionUser] No userId in session data. Session keys: ${Object.keys(session || {}).join(", ")} after ${storeDuration}ms${isMobile ? " (Mobile)" : ""}`,
          );
          resolve(null);
          return;
        }

        console.log(
          `[getSessionUser] Found userId ${userId} in session after ${storeDuration}ms${isMobile ? " (Mobile)" : ""}`,
        );

        try {
          // Get user from database with timeout for serverless
          const userIdNum =
            typeof userId === "number"
              ? userId
              : Number.parseInt(String(userId), 10);
          const dbStartTime = Date.now();

          // Increased timeout for database query (1.5 seconds for mobile/network latency)
          const userPromise = storage.getUser(userIdNum);
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => {
              const dbDuration = Date.now() - dbStartTime;
              if (isMobile) {
                console.log(
                  `[getSessionUser] DB query timeout for userId ${userIdNum} after ${dbDuration}ms (Mobile)`,
                );
              }
              resolve(null);
            }, 1500),
          );

          const user = await Promise.race([userPromise, timeoutPromise]);
          const dbDuration = Date.now() - dbStartTime;

          if (!user) {
            console.log(
              `[getSessionUser] User ${userIdNum} not found in database after ${dbDuration}ms${isMobile ? " (Mobile)" : ""}`,
            );
            resolve(null);
            return;
          }

          console.log(
            `[getSessionUser] Success: Found user ${user.id} (${user.username}) after ${dbDuration}ms${isMobile ? " (Mobile)" : ""}`,
          );

          // Don't send password
          const { password, ...userWithoutPassword } = user;
          resolve(userWithoutPassword);
        } catch (error: any) {
          // Log errors for mobile debugging
          if (isMobile) {
            console.error(
              `[getSessionUser] DB query error: ${error?.message || "Unknown"} (Mobile)`,
            );
          }
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
  // Increased timeout for mobile/serverless environments
  return new Promise<void>((resolve) => {
    const startTime = Date.now();
    // Increased timeout to 3 seconds for serverless/mobile
    const timeout = setTimeout(() => {
      const duration = Date.now() - startTime;
      console.warn(
        `[setSession] Timeout after ${duration}ms for userId ${userId} - session may not be stored`,
      );
      // Don't reject - allow login to continue, but log the issue
      resolve();
    }, 3000);

    try {
      storage.sessionStore.set(sessionId, sessionData, (err) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;

        if (err) {
          console.error(
            `[setSession] Error storing session for userId ${userId} after ${duration}ms:`,
            err.message || err.code,
          );
          // Don't reject - allow login to continue
          // The cookie is set, so the session can be stored on next request
          resolve();
        } else {
          console.log(
            `[setSession] Successfully stored session for userId ${userId} in ${duration}ms`,
          );
          resolve();
        }
      });
    } catch (error: any) {
      clearTimeout(timeout);
      console.error(
        `[setSession] Exception storing session for userId ${userId}:`,
        error?.message,
      );
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
  return (
    user.isAdmin === true || user.role === "writer" || user.role === "admin"
  );
}

// Check if user has a specific role
export async function hasRole(
  req: NextRequest | undefined,
  role: string,
): Promise<boolean> {
  const user = await getSessionUser(req);
  if (!user) return false;

  // Admins (with approval) have all roles
  return (
    user.role === role || (user.isAdmin === true && user.adminApproved === true)
  );
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
