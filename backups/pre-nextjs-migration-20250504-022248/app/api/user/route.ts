import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '../../db';
import { users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, timingSafeEqual, randomBytes } from 'crypto';
import { promisify } from 'util';

// Helper function to hash passwords
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Get the current user if logged in
export async function GET(request: NextRequest) {
  const sessionId = await cookies().get('sessionId')?.value;
  
  if (!sessionId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const { db } = getDb();
    
    // Get user from database using session ID
    // Note: This is simplified - you would typically query a sessions table
    // to get the user ID, then query the users table
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(sessionId))
    });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Don't return password hash
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
    
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// Log out the current user
export async function DELETE(request: NextRequest) {
  try {
    // Clear the session cookie
    cookies().delete('sessionId');
    
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}