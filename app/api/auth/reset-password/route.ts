import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { checkPublicApiRateLimitAsync, getClientIp } from "@/lib/public-api-rate-limit";

const scryptAsync = promisify(scrypt);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await checkPublicApiRateLimitAsync(`reset-password:${ip}`, 25, 60 * 60_000);
    if (!rl.ok) {
      const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { message: "Too many attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        },
      );
    }

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Find user by reset token
    const allUsers = await storage.getAllUsers();
    const user = allUsers.find(u => u.resetToken === token);

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
      return NextResponse.json(
        { message: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password and clear reset token
    await storage.updateUser(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return NextResponse.json({
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Error resetting password" },
      { status: 500 }
    );
  }
}

// Verify token validity
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, message: "Token is required" },
        { status: 400 }
      );
    }

    const allUsers = await storage.getAllUsers();
    const user = allUsers.find((u) => u.resetToken === token);

    if (!user) {
      return NextResponse.json({ valid: false, message: "Invalid token" });
    }

    // Check if token is expired
    if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
      return NextResponse.json({ valid: false, message: "Token has expired" });
    }

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { valid: false, message: "Error verifying token" },
      { status: 500 }
    );
  }
}
