import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { setSession } from "@/lib/auth-helpers";

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function POST(req: NextRequest) {
  try {
    const { username, password, rememberMe } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await storage.getUserByUsername(username);
    
    if (!user || !(await comparePasswords(password, user.password))) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create session
    const sessionId = randomBytes(32).toString("hex");
    const cookieStore = await cookies();
    
    // Set cookie expiration based on remember me
    // If remember me is checked, use 30 days, otherwise use session cookie (expires when browser closes)
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined; // 30 days if remember me, otherwise session cookie
    
    cookieStore.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      ...(maxAge && { maxAge }), // Only set maxAge if rememberMe is true
    });

    // Store session
    setSession(sessionId, user.id);

    // Don't send password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Error during login" },
      { status: 500 }
    );
  }
}
