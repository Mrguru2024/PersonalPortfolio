import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { ensurePrimaryAdminUser, setSession } from "@/lib/auth-helpers";

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
    console.log("Google OAuth callback received");
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Build base URL for redirects
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction ? 'https://mrguru.dev' : (req.headers.get('origin') || 'http://localhost:3000');
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    if (error) {
      console.error("Google OAuth error parameter:", error);
      return NextResponse.redirect(`${baseUrl}/auth?error=google_auth_failed&message=${encodeURIComponent(error)}`);
    }

    if (!code) {
      console.error("Google OAuth: No authorization code received");
      return NextResponse.redirect(`${baseUrl}/auth?error=google_auth_failed&message=No authorization code`);
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("Google OAuth: Missing credentials");
      return NextResponse.redirect(`${baseUrl}/auth?error=google_auth_failed&message=OAuth not configured`);
    }
    
    console.log("Google OAuth - Exchanging code for token");
    console.log("Google OAuth - Redirect URI:", redirectUri);

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
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Google token exchange error:", errorText);
      console.error("Google token exchange status:", tokenResponse.status);
      return NextResponse.redirect(`${baseUrl}/auth?error=google_auth_failed&message=Token exchange failed`);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error("Google token exchange error in response:", tokenData);
      return NextResponse.redirect(`${baseUrl}/auth?error=google_auth_failed&message=${encodeURIComponent(tokenData.error_description || tokenData.error)}`);
    }
    
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      console.error("Google OAuth: No access token in response:", tokenData);
      return NextResponse.redirect(`${baseUrl}/auth?error=google_auth_failed&message=No access token received`);
    }
    
    console.log("Google OAuth - Token exchange successful");

    // Get user info from Google
    console.log("Google OAuth - Fetching user info");
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error("Google user info error:", errorText);
      console.error("Google user info status:", userInfoResponse.status);
      return NextResponse.redirect("/auth?error=google_auth_failed&message=Failed to get user info");
    }

    const profile = await userInfoResponse.json();
    console.log("Google OAuth - User profile received:", { email: profile.email, id: profile.id, name: profile.name });

    // Find or create user
    let user;
    try {
      if (profile.email) {
        console.log("Google OAuth - Looking up user by email:", profile.email);
        user = await storage.getUserByEmail(profile.email);
      }

      if (!user) {
        console.log("Google OAuth - Creating new user");
        // Create new user
        const username = profile.email?.split('@')[0] || `google:${profile.id}`;
        user = await storage.createUser({
          username: username,
          password: await hashPassword(randomBytes(16).toString('hex')),
          email: profile.email || '',
          full_name: profile.name || profile.given_name || '',
          isAdmin: false,
          adminApproved: false,
          avatarUrl: profile.picture,
        });
        console.log("Google OAuth - User created:", user.id);
      } else {
        console.log("Google OAuth - User found, updating if needed");
        // Update existing user with Google info if needed
        if (!user.avatarUrl && profile.picture) {
          user = await storage.updateUser(user.id, {
            avatarUrl: profile.picture,
          });
        }
      }
    } catch (dbError: any) {
      console.error("Google OAuth - Database error:", dbError);
      return NextResponse.redirect(`${baseUrl}/auth?error=google_auth_failed&message=${encodeURIComponent(dbError?.message || "Database error")}`);
    }

    const ensuredUser = await ensurePrimaryAdminUser(user);
    const sessionUser = ensuredUser || user;

    // Create session
    console.log("Google OAuth - Creating session for user:", sessionUser.id);
    let sessionId: string;
    try {
      sessionId = randomBytes(32).toString("hex");
    } catch (cryptoError: any) {
      console.error("Google OAuth - Error generating session ID:", cryptoError);
      return NextResponse.redirect("/auth?error=google_auth_failed&message=Error creating session");
    }
    
    let cookieStore;
    try {
      cookieStore = await cookies();
    } catch (cookieError: any) {
      console.error("Google OAuth - Error getting cookie store:", cookieError);
      return NextResponse.redirect("/auth?error=google_auth_failed&message=Error setting up session");
    }
    
    try {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      };
      cookieStore.set("sessionId", sessionId, cookieOptions);
      console.log("Google OAuth - Session cookie set with options:", cookieOptions);
      console.log("Google OAuth - Cookie value length:", sessionId.length);
    } catch (setCookieError: any) {
      console.error("Google OAuth - Error setting cookie:", setCookieError);
      return NextResponse.redirect(`${baseUrl}/auth?error=google_auth_failed&message=Error setting session cookie`);
    }

    // Store session in database
    try {
      console.log("Google OAuth - Storing session in database, sessionId:", sessionId, "userId:", user.id);
      await setSession(sessionId, sessionUser.id);
      console.log("Google OAuth - Session stored in database successfully");
      
      // Verify session was stored
      await new Promise<void>((resolve, reject) => {
        storage.sessionStore.get(sessionId, (err, storedSession) => {
          if (err) {
            console.error("Google OAuth - Error verifying session storage:", err);
            reject(err);
            return;
          }
          if (!storedSession) {
            console.error("Google OAuth - Session verification failed: session not found after storage");
            reject(new Error("Session not found after storage"));
            return;
          }
          console.log("Google OAuth - Session verification successful, userId in stored session:", (storedSession as any).userId);
          resolve();
        });
      });
    } catch (sessionError: any) {
      console.error("Google OAuth - CRITICAL: Failed to store session:", sessionError);
      console.error("Session error details:", {
        message: sessionError?.message,
        stack: sessionError?.stack,
        code: sessionError?.code,
      });
      // Don't continue - session must be stored
      return NextResponse.redirect(`${baseUrl}/auth?error=google_auth_failed&message=Failed to create session`);
    }

    // Redirect to home page
    console.log("Google OAuth - Authentication successful, redirecting to home");
    const homeUrl = isProduction ? 'https://mrguru.dev' : (req.headers.get('origin') || 'http://localhost:3000');
    return NextResponse.redirect(homeUrl);
  } catch (error: any) {
    console.error("Google OAuth callback error:", error);
    console.error("Error stack:", error?.stack);
    console.error("Error details:", {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    });
    // Build base URL for error redirect
    const errorBaseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://mrguru.dev' 
      : (req.headers.get('origin') || 'http://localhost:3000');
    return NextResponse.redirect(`${errorBaseUrl}/auth?error=google_auth_failed&message=${encodeURIComponent(error?.message || "Unknown error")}`);
  }
}
