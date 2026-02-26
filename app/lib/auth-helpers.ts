import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { storage } from "@server/storage";

const isDev = process.env.NODE_ENV !== "production";

// Session management for Next.js App Router
// Optimized for serverless environments with fast timeouts
export async function getSessionUser(
  req?: NextRequest,
  sessionIdFromCaller?: string
): Promise<any | null> {
  const userAgent = req?.headers.get("user-agent") || "unknown";
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

  try {
    let sessionId: string | undefined = sessionIdFromCaller;

    if (sessionId === undefined) {
      const cookieHeader = req?.headers.get("cookie") || "";
      const cookieStore = await cookies();
      sessionId =
        cookieStore.get("sessionId")?.value ??
        cookieStore.get("connect.sid")?.value;

      if (isDev && !sessionId) {
        console.log(
          `[getSessionUser] cookies() returned no sessionId. Cookie header: ${
            cookieHeader ? cookieHeader.substring(0, 80) + "..." : "NONE"
          }`
        );
      }

      if (!sessionId && cookieHeader) {
        const match = cookieHeader.match(
          /(?:^|;\s*)(?:sessionId|connect\.sid)=([^;]+)/
        );
        if (match) {
          sessionId = match[1].trim();
          if (isDev) {
            console.log(
              `[getSessionUser] Found sessionId in Cookie header fallback: ${sessionId.substring(0, 16)}...`
            );
          }
        } else if (isDev) {
          console.log(
            `[getSessionUser] Cookie header exists but no sessionId/connect.sid found. Header: ${cookieHeader.substring(0, 100)}...`
          );
        }
      }
    }

    if (!sessionId) {
      if (isDev) {
        console.log(
          `[getSessionUser] No sessionId found anywhere - returning null`
        );
      }
      return null;
    }

    if (isDev) {
      console.log(
        `[getSessionUser] SessionId found: ${sessionId.substring(0, 16)}...`
      );
    }

    // Get session from session store directly (avoid circular dependency)
    return new Promise((resolve) => {
      // connect-pg-simple stores sessions with the session ID as-is
      const storeStartTime = Date.now();

      // Short timeout so /api/user responds quickly; session store can be slow (e.g. cold DB)
      const timeout = setTimeout(() => {
        const storeDuration = Date.now() - storeStartTime;
        if (isDev) {
          console.warn(
            `[getSessionUser] Session store timeout after ${storeDuration}ms. Log out and log back in.`
          );
        }
        resolve(null);
      }, 1500);

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
            if (isDev && isMobile) {
              console.log(
                `[getSessionUser] ENOENT error (table.sql) after ${storeDuration}ms (Mobile)`
              );
            }
            resolve(null);
            return;
          }

          if (
            err.code === "ECONNREFUSED" ||
            err.code === "ETIMEDOUT" ||
            err.message?.includes("timeout")
          ) {
            if (isDev && isMobile) {
              console.log(
                `[getSessionUser] DB connection error: ${err.code} after ${storeDuration}ms (Mobile)`
              );
            }
            resolve(null);
            return;
          }

          if (isDev && isMobile) {
            console.error(
              `[getSessionUser] Session store error: ${err.message || err.code} after ${storeDuration}ms (Mobile)`
            );
          }
          resolve(null);
          return;
        }

        if (!session) {
          if (isDev) {
            console.warn(
              `[getSessionUser] Session not in store for sessionId ${sessionId.substring(0, 16)}... (${storeDuration}ms). Log out and log back in to create a new session.`
            );
          }
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
          if (isDev) {
            console.log(
              `[getSessionUser] No userId in session data. Session keys: ${Object.keys(session || {}).join(", ")} after ${storeDuration}ms${isMobile ? " (Mobile)" : ""}`
            );
          }
          resolve(null);
          return;
        }

        if (isDev) {
          console.log(
            `[getSessionUser] Found userId ${userId} in session after ${storeDuration}ms${isMobile ? " (Mobile)" : ""}`
          );
        }

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
              if (isDev && isMobile) {
                const dbDuration = Date.now() - dbStartTime;
                console.log(
                  `[getSessionUser] DB query timeout for userId ${userIdNum} after ${dbDuration}ms (Mobile)`
                );
              }
              resolve(null);
            }, 1500)
          );

          const user = await Promise.race([userPromise, timeoutPromise]);
          const dbDuration = Date.now() - dbStartTime;

          if (!user) {
            if (isDev) {
              console.log(
                `[getSessionUser] User ${userIdNum} not found in database after ${dbDuration}ms${isMobile ? " (Mobile)" : ""}`
              );
            }
            resolve(null);
            return;
          }

          if (isDev) {
            console.log(
              `[getSessionUser] Success: Found user ${user.id} (${user.username}) after ${dbDuration}ms${isMobile ? " (Mobile)" : ""}`
            );
          }

          // Don't send password
          const { password, ...userWithoutPassword } = user;
          resolve(userWithoutPassword);
        } catch (error: unknown) {
          if (isDev && isMobile) {
            const msg =
              error instanceof Error
                ? error.message
                : typeof (error as { message?: unknown })?.message === "string"
                  ? (error as { message: string }).message
                  : "Unknown";
            console.error(
              `[getSessionUser] DB query error: ${msg} (Mobile)`
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
      if (isDev) {
        console.warn(
          `[setSession] Timeout after ${duration}ms for userId ${userId} - session may not be stored`
        );
      }
      resolve();
    }, 3000);

    const tryDirectInsert = () => {
      (storage as { insertSessionDirect?: (sid: string, sess: Record<string, unknown>, expire: Date) => Promise<void> })
        .insertSessionDirect?.(sessionId, sessionData, sessionData.cookie.expires)
        .then(() => {
          if (isDev) console.log(`[setSession] Stored via direct INSERT for userId ${userId}`);
          resolve();
        })
        .catch((e: unknown) => {
          if (isDev) console.error(`[setSession] Direct INSERT failed:`, (e as Error)?.message);
          resolve();
        });
    };

    try {
      storage.sessionStore.set(sessionId, sessionData, (err) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;

        if (err) {
          if (isDev) {
            console.error(
              `[setSession] Error storing session for userId ${userId} after ${duration}ms:`,
              err.message || err.code
            );
            console.log(`[setSession] Trying direct INSERT fallback...`);
          }
          tryDirectInsert();
        } else {
          if (isDev) {
            console.log(
              `[setSession] Successfully stored session for userId ${userId} in ${duration}ms`
            );
          }
          resolve();
        }
      });
    } catch (error: any) {
      clearTimeout(timeout);
      if (isDev) {
        console.error(
          `[setSession] Exception storing session for userId ${userId}:`,
          error?.message
        );
        console.log(`[setSession] Trying direct INSERT fallback...`);
      }
      tryDirectInsert();
    }
  });
}

export function deleteSession(sessionId: string): void {
  storage.sessionStore.destroy(sessionId, (err) => {
    if (err && isDev) {
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
  role: string
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
