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
 * GitHub OAuth callback route
 * Handles the OAuth callback and creates/logs in the user
 */
export async function GET(req: NextRequest) {
  try {
    // Build base URL for redirects
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction ? 'https://mrguru.dev' : (req.headers.get('origin') || 'http://localhost:3000');
    
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(`${baseUrl}/auth?error=github_auth_failed&message=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/auth?error=github_auth_failed&message=No authorization code`);
    }

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      return NextResponse.redirect(`${baseUrl}/auth?error=github_auth_failed&message=OAuth not configured`);
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("GitHub token exchange error:", errorText);
      return NextResponse.redirect(`${baseUrl}/auth?error=github_auth_failed&message=Token exchange failed`);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      return NextResponse.redirect(`${baseUrl}/auth?error=github_auth_failed&message=${encodeURIComponent(tokenData.error_description || tokenData.error)}`);
    }

    const accessToken = tokenData.access_token;

    // Get user info from GitHub
    const userInfoResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error("GitHub user info error:", errorText);
      return NextResponse.redirect(`${baseUrl}/auth?error=github_auth_failed&message=Failed to get user info`);
    }

    const profile = await userInfoResponse.json();

    // Get user email (may require additional API call)
    let email = profile.email;
    if (!email) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        email = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
      }
    }

    // Find or create user
    let user;
    if (email) {
      user = await storage.getUserByEmail(email);
    }
    
    // Also check by GitHub username
    if (!user) {
      user = await storage.getUserByUsername(profile.login);
    }

    if (!user) {
      // Create new user
      user = await storage.createUser({
        username: profile.login || `github:${profile.id}`,
        password: await hashPassword(randomBytes(16).toString('hex')),
        email: email || '',
        full_name: profile.name || profile.login || '',
        isAdmin: false,
        adminApproved: false,
        githubId: profile.id.toString(),
        githubUsername: profile.login,
        avatarUrl: profile.avatar_url,
      });
    } else {
      // Update existing user with GitHub info if needed
      const updates: any = {};
      if (!user.githubId) updates.githubId = profile.id.toString();
      if (!user.githubUsername) updates.githubUsername = profile.login;
      if (!user.avatarUrl && profile.avatar_url) updates.avatarUrl = profile.avatar_url;
      
      if (Object.keys(updates).length > 0) {
        user = await storage.updateUser(user.id, updates);
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
    return NextResponse.redirect(baseUrl);
  } catch (error: any) {
    console.error("GitHub OAuth callback error:", error);
    const errorBaseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://mrguru.dev' 
      : (req.headers.get('origin') || 'http://localhost:3000');
    return NextResponse.redirect(`${errorBaseUrl}/auth?error=github_auth_failed&message=${encodeURIComponent(error?.message || "Unknown error")}`);
  }
}
