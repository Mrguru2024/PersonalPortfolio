import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { cookies } from "next/headers";

// Ensure this route is always dynamic so cookies are read from the request (fixes 401 on mobile/Vercel)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const isDev = process.env.NODE_ENV !== "production";

// Optimized for serverless - fast response, minimal logging in production
export async function GET(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "unknown";
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  const cookieHeader = req.headers.get("cookie") || "";

  try {
    const cookieStore = await cookies();
    let sessionId: string | undefined =
      cookieStore.get("sessionId")?.value ??
      cookieStore.get("connect.sid")?.value;

    if (!sessionId && cookieHeader) {
      const match = cookieHeader.match(
        /(?:^|;\s*)(?:sessionId|connect\.sid)=([^;]+)/,
      );
      if (match) sessionId = match[1].trim();
    }

    if (!sessionId) {
      return NextResponse.json(null);
    }

    if (isDev) {
      const origin = req.headers.get("origin") || req.headers.get("referer") || "unknown";
      console.log(
        `[GET /api/user] Request from ${origin}${isMobile ? " (Mobile)" : ""}, sessionId: ${sessionId.substring(0, 16)}...`,
      );
    }

    const startTime = Date.now();
    // Swallow rejections (e.g. ErrorEvent from DB/Neon) so Next.js never tries to set .message on them
    const userPromise = getSessionUser(req, sessionId).catch(() => null);
    const timeoutMs = 1500;
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), timeoutMs),
    );

    const user = await Promise.race([userPromise, timeoutPromise]);
    const duration = Date.now() - startTime;

    if (!user) {
      return NextResponse.json(null);
    }

    if (isDev) {
      console.log(
        `[GET /api/user] Success: User ${user.id} (${user.username}) in ${duration}ms${isMobile ? " (Mobile)" : ""}`,
      );
    }

    // Don't send password
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error: unknown) {
    if (isDev) {
      const msg =
        error instanceof Error
          ? error.message
          : typeof (error as { message?: unknown })?.message === "string"
            ? (error as { message: string }).message
            : "Unknown error";
      console.error("[GET /api/user] Error:", msg, isMobile ? "(Mobile)" : "");
    }
    return NextResponse.json(null);
  }
}
