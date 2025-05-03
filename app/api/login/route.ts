import { getDb } from '@/app/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' }, 
        { status: 400 }
      );
    }
    
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.username, username));
    
    if (!user || !(await comparePasswords(password, user.password))) {
      return NextResponse.json(
        { message: 'Invalid username or password' }, 
        { status: 401 }
      );
    }
    
    // Set a session cookie
    const sessionId = randomBytes(32).toString('hex');
    const cookieStore = cookies();
    cookieStore.set('session_id', sessionId, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/' 
    });
    
    // Return the user without sensitive information
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login' }, 
      { status: 500 }
    );
  }
}