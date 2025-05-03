import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '../../db';
import { users } from '../../../shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data', details: result.error.format() }, { status: 400 });
    }

    const { username, email, password } = result.data;
    const { db } = getDb();

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq, or }) => or(
        eq(users.username, username),
        eq(users.email, email)
      ),
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: existingUser.username === username 
          ? 'Username already taken' 
          : 'Email already registered' 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const [newUser] = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      avatarUrl: null,
      isAdmin: false,
      createdAt: new Date(),
    }).returning();

    // Set session cookie
    const response = NextResponse.json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
    }, { status: 201 });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}