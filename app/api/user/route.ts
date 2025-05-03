import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Temporary mock user for development
const MOCK_USER = {
  id: 1,
  username: 'mrguru',
  email: 'mrguru@example.com',
  name: 'Anthony Feaster',
  role: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// A simplified getUserFromSession function for development
const getUserFromSession = async (sessionId: string) => {
  // Return our mock user for development purposes
  return MOCK_USER;
};

export async function GET(request: NextRequest) {
  try {
    // For development: Check the Authorization header instead of cookies
    // In production, you would validate a proper session token
    const authHeader = request.headers.get('Authorization');
    
    // If no Authorization header, or it's not for development, return 401
    if (!authHeader || authHeader !== 'Bearer development-token') {
      // Return a fixed JSON response for predictability
      return NextResponse.json(
        { message: 'Not authenticated' }, 
        { status: 401 }
      );
    }
    
    // Just return our mock user
    return NextResponse.json(MOCK_USER);
    
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching user data' }, 
      { status: 500 }
    );
  }
}