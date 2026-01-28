import { NextRequest, NextResponse } from "next/server";

/**
 * Google OAuth initiation route
 * Redirects to Google OAuth authorization page
 */
export async function GET(req: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "Google OAuth not configured" },
      { status: 500 }
    );
  }

  // Build the authorization URL
  // Use consistent base URL - check if we're in production or development
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = isProduction
    ? 'https://mrguru.dev'
    : 'http://localhost:3000';
  
  const callbackUrl = `${baseUrl}/api/auth/google/callback`;
  
  // Log for debugging
  console.log('Google OAuth - Callback URL being used:', callbackUrl);
  console.log('Google OAuth - NODE_ENV:', process.env.NODE_ENV);
  console.log('Google OAuth - Request origin:', req.headers.get('origin'));
  
  const redirectUri = encodeURIComponent(callbackUrl);
  const clientId = encodeURIComponent(process.env.GOOGLE_CLIENT_ID);
  const scope = encodeURIComponent('profile email');
  const responseType = 'code';
  const accessType = 'offline';
  const prompt = 'consent';
  
  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Build the full authorization URL
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&access_type=${accessType}&prompt=${prompt}&state=${state}`;
  
  // Log the redirect URI being sent (decoded for verification)
  console.log('Google OAuth - Redirect URI (decoded):', callbackUrl);
  console.log('Google OAuth - Redirect URI (encoded):', redirectUri);
  
  // Store state in a cookie for verification in callback
  const response = NextResponse.redirect(authUrl);
  
  // Set state cookie (expires in 10 minutes)
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  
  return response;
}
