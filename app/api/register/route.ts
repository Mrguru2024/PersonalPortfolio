import { getDb } from '@/app/db';
import { users, insertUserSchema } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod schema
    const result = insertUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid user data', errors: result.error.format() }, 
        { status: 400 }
      );
    }
    
    const { username, password, ...rest } = body;
    
    const db = getDb();
    
    // Check if username already exists
    const [existingUser] = await db.select().from(users).where(eq(users.username, username));
    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already exists' }, 
        { status: 400 }
      );
    }
    
    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const [user] = await db.insert(users)
      .values({ ...rest, username, password: hashedPassword })
      .returning();
    
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
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'An error occurred during registration' }, 
      { status: 500 }
    );
  }
}