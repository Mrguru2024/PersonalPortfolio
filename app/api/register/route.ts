import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { setSession, getIpAddress } from "@/lib/auth-helpers";
import { userMatchesSuperAdminIdentity } from "@shared/super-admin-identities";
import { recordActivityLog } from "@server/activityLog";
import { checkPublicApiRateLimitAsync, getClientIp } from "@/lib/public-api-rate-limit";
import { buildTrialSummaryForClient } from "@shared/userTrial";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await checkPublicApiRateLimitAsync(`register:${ip}`, 8, 60 * 60_000);
    if (!rl.ok) {
      const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { message: "Too many registration attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        },
      );
    }

    const { username, email, password, requestAdmin } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Username, email, and password are required" },
        { status: 400 },
      );
    }

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 400 },
      );
    }

    // requestAdmin: founder requests backend access; must be approved by developer
    const wantsAdmin = !!requestAdmin;
    const user = await storage.createUser({
      username,
      email,
      password: await hashPassword(password),
      isAdmin: wantsAdmin,
      adminApproved: false,
      role: wantsAdmin ? "admin" : "user",
    });

    const sessionId = randomBytes(32).toString("hex");
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    };

    await setSession(sessionId, user.id);

    try {
      await recordActivityLog("login_success", true, {
        userId: user.id,
        identifier: user.username,
        message: "Account registration",
        ipAddress: getIpAddress(req),
        userAgent: req.headers.get("user-agent") ?? undefined,
      });
    } catch {
      /* logged inside recordActivityLog */
    }

    const { password: _, ...userWithoutPassword } = user;
    const isSuperUser = userMatchesSuperAdminIdentity(userWithoutPassword);
    const body = {
      ...userWithoutPassword,
      isSuperUser,
      trial: buildTrialSummaryForClient({ ...userWithoutPassword, isSuperUser }),
    };
    const res = NextResponse.json(body, { status: 201 });
    res.cookies.set("sessionId", sessionId, cookieOptions);
    return res;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 },
    );
  }
}
