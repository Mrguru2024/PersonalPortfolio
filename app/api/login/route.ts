import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { setSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function POST(req: NextRequest) {
  try {
    // Step 1: Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError: any) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { message: "Invalid request body", error: parseError?.message },
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

    // Step 2: Get user from database (try username first, then email)
    let user;
    try {
      user = await storage.getUserByUsername(username);
      // If not found by username, try email
      if (!user && username.includes("@")) {
        console.log("User not found by username, trying email:", username);
        user = await storage.getUserByEmail(username);
      }
      if (!user) {
        console.log("User not found by username or email:", username);
      } else {
        console.log("User found:", user.id, user.username, user.email);
      }
    } catch (dbError: any) {
      console.error("Database error fetching user:", dbError);
      return NextResponse.json(
        {
          message: "Database error",
          ...(process.env.NODE_ENV === "development" && {
            error: dbError?.message,
          }),
        },
        { status: 500 },
      );
    }

    // Step 3: Verify password
    if (!user) {
      console.log("Login failed: User not found");
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 },
      );
    }

    let passwordMatch;
    try {
      console.log("Comparing password for user:", user.id);
      passwordMatch = await comparePasswords(password, user.password);
      console.log("Password match result:", passwordMatch);
    } catch (compareError: any) {
      console.error("Error comparing passwords:", compareError);
      console.error("Compare error details:", {
        message: compareError?.message,
        stack: compareError?.stack,
      });
      return NextResponse.json(
        {
          message: "Error verifying password",
          ...(process.env.NODE_ENV === "development" && {
            error: compareError?.message,
          }),
        },
        { status: 500 },
      );
    }

    if (!passwordMatch) {
      console.log("Login failed: Password does not match");
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 },
      );
    }

    console.log("Login successful for user:", user.id, user.username);

    // Step 4: Create session ID and set cookie
    let sessionId: string;
    try {
      sessionId = randomBytes(32).toString("hex");
    } catch (cryptoError: any) {
      console.error("Error generating session ID:", cryptoError);
      return NextResponse.json(
        {
          message: "Error creating session",
          ...(process.env.NODE_ENV === "development" && {
            error: cryptoError?.message,
          }),
        },
        { status: 500 },
      );
    }

    let cookieStore;
    try {
      cookieStore = await cookies();
    } catch (cookieError: any) {
      console.error("Error getting cookie store:", cookieError);
      return NextResponse.json(
        {
          message: "Error setting up session",
          ...(process.env.NODE_ENV === "development" && {
            error: cookieError?.message,
          }),
        },
        { status: 500 },
      );
    }

    // Set cookie expiration based on remember me
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined;

    try {
      // Cookie settings optimized for mobile browsers and serverless
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Required for HTTPS
        sameSite: "lax" as const, // Works for most mobile browsers
        path: "/",
        ...(maxAge && { maxAge }),
      };
      cookieStore.set("sessionId", sessionId, cookieOptions);
      console.log(
        `[Login] ✅ Session cookie set - sessionId: ${sessionId.substring(0, 16)}..., options:`,
        {
          httpOnly: cookieOptions.httpOnly,
          secure: cookieOptions.secure,
          sameSite: cookieOptions.sameSite,
          path: cookieOptions.path,
          maxAge: cookieOptions.maxAge || "session",
        },
      );
    } catch (setCookieError: any) {
      console.error("Error setting cookie:", setCookieError);
      return NextResponse.json(
        {
          message: "Error setting session cookie",
          ...(process.env.NODE_ENV === "development" && {
            error: setCookieError?.message,
          }),
        },
        { status: 500 },
      );
    }

    // Step 5: Store session in database (non-fatal but important)
    try {
      console.log(
        `[Login] Storing session for user ${user.id} with sessionId ${sessionId.substring(0, 16)}...`,
      );
      await setSession(sessionId, user.id);
      console.log(`[Login] Session storage completed for user ${user.id}`);
    } catch (sessionError: any) {
      // Log session storage error but don't fail login
      console.error(
        `[Login] Warning: Failed to store session in database for user ${user.id}:`,
        sessionError,
      );
      console.error("Session storage error details:", {
        message: sessionError?.message,
        code: sessionError?.code,
        path: sessionError?.path,
        stack: sessionError?.stack,
      });
      // Continue with login - the cookie is set, session can be stored on next request
    }

    // Step 6: Return user data
    try {
      const { password: _, ...userWithoutPassword } = user;
      return NextResponse.json(userWithoutPassword);
    } catch (responseError: any) {
      console.error("Error creating response:", responseError);
      return NextResponse.json(
        {
          message: "Error preparing response",
          ...(process.env.NODE_ENV === "development" && {
            error: responseError?.message,
          }),
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Unexpected login error:", error);
    console.error("Error stack:", error?.stack);
    console.error("Error details:", {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      cause: error?.cause,
    });
    return NextResponse.json(
      {
        message: "Error during login",
        ...(process.env.NODE_ENV === "development" && {
          error: error?.message || "Unknown error",
          stack: error?.stack,
        }),
      },
      { status: 500 },
    );
  }
}
