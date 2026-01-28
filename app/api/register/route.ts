import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { setSession } from "@/lib/auth-helpers";

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
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Username, email, and password are required" },
        { status: 400 },
      );
    }

    // Check if username already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 400 },
      );
    }

    // Create new user (adminApproved is always false by default)
    const user = await storage.createUser({
      username,
      email,
      password: await hashPassword(password),
      isAdmin: false,
      adminApproved: false,
    });

    // Create session
    const sessionId = randomBytes(32).toString("hex");
    const cookieStore = await cookies();
    // Cookie settings optimized for mobile browsers and serverless
    cookieStore.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Required for HTTPS
      sameSite: "lax" as const, // Works for most mobile browsers
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Store session and wait for it to be saved
    await setSession(sessionId, user.id);

    // Don't send password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 },
    );
  }
}
