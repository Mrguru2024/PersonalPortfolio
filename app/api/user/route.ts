import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { cookies } from "next/headers";

// Ensure this route is always dynamic so cookies are read from the request (fixes 401 on mobile/Vercel)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Optimized for serverless - fast response with diagnostic logging
export async function GET(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "unknown";
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

  try {
    // Check for session cookie first (fast check) – use same source as getSessionUser
    const cookieStore = await cookies();
    let sessionId: string | undefined =
      cookieStore.get("sessionId")?.value ??
      cookieStore.get("connect.sid")?.value;
    if (!sessionId && req.headers.get("cookie")) {
      const match = req.headers
        .get("cookie")
        ?.match(/(?:^|;\s*)(?:sessionId|connect\.sid)=([^;]+)/);
      if (match) sessionId = match[1].trim();
    }

    if (!sessionId) {
      console.log(
        `[GET /api/user] No session cookie found${isMobile ? ` (Mobile: ${userAgent.substring(0, 50)})` : ""}`,
      );
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    console.log(
      `[GET /api/user] Cookie found, length: ${sessionId.length}, preview: ${sessionId.substring(0, 16)}...${isMobile ? " (Mobile)" : ""}`,
    );

    // Fast timeout for serverless (2 seconds max)
    const startTime = Date.now();
    const userPromise = getSessionUser(req);
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => {
        if (isMobile) {
          console.log(
            `[GET /api/user] Session lookup timeout after ${Date.now() - startTime}ms (Mobile)`,
          );
        }
        resolve(null);
      }, 2000),
    );

    const user = await Promise.race([userPromise, timeoutPromise]);
    const duration = Date.now() - startTime;

    if (!user) {
      // Cookie exists but session lookup failed - return 401
      console.log(
        `[GET /api/user] Session lookup failed (cookie exists but no user found) after ${duration}ms${isMobile ? " (Mobile)" : ""}`,
      );
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    console.log(
      `[GET /api/user] Success: User ${user.id} (${user.username}) authenticated in ${duration}ms${isMobile ? " (Mobile)" : ""}`,
    );

    // Don't send password
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error(
      "[GET /api/user] Error:",
      err?.message ?? "Unknown error",
      isMobile ? "(Mobile)" : "",
    );
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
}
