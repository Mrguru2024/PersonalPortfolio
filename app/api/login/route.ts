import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { recordActivityLog } from "@server/activityLog";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { setSession, getIpAddress } from "@/lib/auth-helpers";
import { userMatchesSuperAdminIdentity } from "@shared/super-admin-identities";
import { buildTrialSummaryForClient } from "@shared/userTrial";
import { captureApiError } from "@/lib/systemMonitor";
import { checkPublicApiRateLimitAsync, getClientIp } from "@/lib/public-api-rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  if (typeof stored !== "string" || !stored.includes(".")) return false;
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    if (hashedBuf.length === 0) return false;
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    if (hashedBuf.length !== suppliedBuf.length) return false;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Step 1: Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError: unknown) {
      console.error("[POST /api/login] invalid JSON body");
      const isDev = process.env.NODE_ENV === "development";
      const detail =
        isDev && parseError instanceof Error ? parseError.message : undefined;
      return NextResponse.json(
        { message: "Invalid request body", ...(detail ? { error: detail } : {}) },
        { status: 400 },
      );
    }

    const { username, password, rememberMe } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 },
      );
    }

    const ip = getClientIp(req);
    const rl = await checkPublicApiRateLimitAsync(`login:${ip}`, 40, 15 * 60_000);
    if (!rl.ok) {
      const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
      try {
        await recordActivityLog("login_failure", false, {
          identifier: username,
          message: "Rate limited (too many login attempts)",
          ipAddress: getIpAddress(req),
          userAgent: req.headers.get("user-agent") ?? undefined,
          metadata: { retryAfterSec: retryAfter },
        });
      } catch {
        /* logged inside recordActivityLog */
      }
      return NextResponse.json(
        { message: "Too many login attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        },
      );
    }

    // Step 2: Get user from database (try username first, then email)
    let user;
    try {
      user = await storage.getUserByUsername(username);
      // If not found by username, try email
      if (!user && username.includes("@")) {
        user = await storage.getUserByEmail(username);
      }
    } catch (dbError: unknown) {
      const dbMsg = dbError instanceof Error ? dbError.message : String(dbError);
      console.error("[POST /api/login] database error during user lookup");
      try {
        await recordActivityLog("error", false, {
          message: dbMsg || "Database error during login user lookup",
          identifier: username,
          ipAddress: getIpAddress(req),
          userAgent: req.headers.get("user-agent") ?? undefined,
          metadata: { route: "/api/login", phase: "user_lookup" },
        });
      } catch {
        /* logged inside recordActivityLog */
      }
      const isDev = process.env.NODE_ENV === "development";
      /** Shown in the client via apiRequest() — include Postgres hint in dev; safe summary in prod. */
      const message = isDev
        ? `Database error: ${dbMsg || "unknown"}`
        : "Sign-in failed (database). If you upgraded the app, run npm run db:push with your DATABASE_URL, then retry.";
      return NextResponse.json(
        {
          message,
          ...(isDev ? { error: dbMsg } : {}),
        },
        { status: 500 },
      );
    }

    // Step 3: Verify password
    if (!user) {
      try {
        await recordActivityLog("login_failure", false, {
          identifier: username,
          message: "User not found",
          ipAddress: getIpAddress(req),
          userAgent: req.headers.get("user-agent") ?? undefined,
        });
      } catch {
        /* logged inside recordActivityLog */
      }
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 },
      );
    }

    let passwordMatch;
    try {
      passwordMatch = await comparePasswords(password, user.password);
    } catch (compareError: unknown) {
      console.error("[POST /api/login] password verify error");
      return NextResponse.json(
        {
          message: "Error verifying password",
          ...(process.env.NODE_ENV === "development" && compareError instanceof Error
            ? { error: compareError.message }
            : {}),
        },
        { status: 500 },
      );
    }

    if (!passwordMatch) {
      try {
        await recordActivityLog("login_failure", false, {
          userId: user.id,
          identifier: user.username,
          message: "Invalid password",
          ipAddress: getIpAddress(req),
          userAgent: req.headers.get("user-agent") ?? undefined,
        });
      } catch {
        /* logged inside recordActivityLog */
      }
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 },
      );
    }

    // Step 4: Create session ID and set cookie
    let sessionId: string;
    try {
      sessionId = randomBytes(32).toString("hex");
    } catch (cryptoError: unknown) {
      console.error("[POST /api/login] session id generation failed");
      return NextResponse.json(
        {
          message: "Error creating session",
          ...(process.env.NODE_ENV === "development" && cryptoError instanceof Error
            ? { error: cryptoError.message }
            : {}),
        },
        { status: 500 },
      );
    }

    // Cookie options (attached to the JSON response — avoids next/headers cookie mutation issues in some Next runtimes)
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined;
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      ...(maxAge !== undefined && { maxAge }),
    };

    // Step 5: Store session in database (non-fatal but important)
    try {
      await setSession(sessionId, user.id);
    } catch (sessionError: unknown) {
      console.error("[POST /api/login] session persistence warning");
      if (process.env.NODE_ENV === "development" && sessionError instanceof Error) {
        console.error(sessionError.message);
      }
    }

    // Step 6: Record success and return user data (await so the row exists before response)
    try {
      await recordActivityLog("login_success", true, {
        userId: user.id,
        identifier: user.username,
        ipAddress: getIpAddress(req),
        userAgent: req.headers.get("user-agent") ?? undefined,
      });
    } catch {
      /* recordActivityLog logs insert failures */
    }

    try {
      const { password: _, ...userWithoutPassword } = user;
      const isSuperUser = userMatchesSuperAdminIdentity(userWithoutPassword);
      const body = {
        ...userWithoutPassword,
        isSuperUser,
        trial: buildTrialSummaryForClient({ ...userWithoutPassword, isSuperUser }),
      };
      const res = NextResponse.json(body);
      res.cookies.set("sessionId", sessionId, cookieOptions);
      return res;
    } catch (responseError: unknown) {
      console.error("[POST /api/login] response serialization error");
      return NextResponse.json(
        {
          message: "Error preparing response",
          ...(process.env.NODE_ENV === "development" && responseError instanceof Error
            ? { error: responseError.message }
            : {}),
        },
        { status: 500 },
      );
    }
  } catch (error: unknown) {
    captureApiError(error, req);
    try {
      const errMsg = error instanceof Error ? error.message : "Login error";
      await recordActivityLog("error", false, {
        message: errMsg,
        ipAddress: getIpAddress(req),
        userAgent: req.headers.get("user-agent") ?? undefined,
        metadata: {
          stack: error instanceof Error ? error.stack?.slice(0, 2000) : undefined,
        },
      });
    } catch {
      /* logged inside recordActivityLog */
    }
    console.error("[POST /api/login] unexpected error");
    if (process.env.NODE_ENV === "development" && error instanceof Error) {
      console.error(error.message, error.stack);
    }
    const devErr =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? { error: error.message, stack: error.stack }
        : {};
    return NextResponse.json(
      {
        message: "Error during login",
        ...devErr,
      },
      { status: 500 },
    );
  }
}
