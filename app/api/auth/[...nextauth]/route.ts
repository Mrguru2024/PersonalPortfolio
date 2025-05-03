import { getDb } from '@/app/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Route handlers
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  
  if (!sessionId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  
  // Here you would validate the session and return the user
  // For now, we'll just return a mock response
  return NextResponse.json({ id: 1, username: 'admin', name: 'Administrator' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;
  
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.username, username));
  
  if (!user || !(await comparePasswords(password, user.password))) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
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
}