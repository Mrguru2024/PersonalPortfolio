import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { setSession } from "@/lib/auth-helpers";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Google OAuth callback route
 * Handles the OAuth callback and creates/logs in the user
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(`/auth?error=google_auth_failed&message=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return NextResponse.redirect("/auth?error=google_auth_failed&message=No authorization code");
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect("/auth?error=google_auth_failed&message=OAuth not configured");
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.NODE_ENV === 'production'
          ? 'https://mrguru.dev/api/auth/google/callback'
          : 'http://localhost:3000/api/auth/google/callback',
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Google token exchange error:", errorText);
      return NextResponse.redirect("/auth?error=google_auth_failed&message=Token exchange failed");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect("/auth?error=google_auth_failed&message=Failed to get user info");
    }

    const profile = await userInfoResponse.json();

    // Find or create user
    let user;
    if (profile.email) {
      user = await storage.getUserByEmail(profile.email);
    }

    if (!user) {
      // Create new user
      const username = profile.email?.split('@')[0] || `google:${profile.id}`;
      user = await storage.createUser({
        username: username,
        password: await hashPassword(randomBytes(16).toString('hex')),
        email: profile.email || '',
        full_name: profile.name || profile.given_name || '',
        isAdmin: false,
        avatarUrl: profile.picture,
      });
    } else {
      // Update existing user with Google info if needed
      if (!user.avatarUrl && profile.picture) {
        user = await storage.updateUser(user.id, {
          avatarUrl: profile.picture,
        });
      }
    }

    // Create session
    const sessionId = randomBytes(32).toString("hex");
    const cookieStore = await cookies();
    
    cookieStore.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Store session in database
    try {
      await setSession(sessionId, user.id);
    } catch (sessionError) {
      console.error("Warning: Failed to store session:", sessionError);
      // Continue anyway - cookie is set
    }

    // Redirect to home page
    return NextResponse.redirect("/");
  } catch (error: any) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(`/auth?error=google_auth_failed&message=${encodeURIComponent(error?.message || "Unknown error")}`);
  }
}
