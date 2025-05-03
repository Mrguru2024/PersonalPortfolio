import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/db';
import { resumeRequests, resumeRequestFormSchema } from '@/shared/schema';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate form data with Zod schema
    const result = resumeRequestFormSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid resume request data', errors: result.error.format() }, 
        { status: 400 }
      );
    }
    
    const { name, email, reason } = result.data;
    
    // Generate a unique token for resume access
    const token = randomBytes(32).toString('hex');
    
    const db = getDb();
    const [resumeRequest] = await db.insert(resumeRequests)
      .values({
        name,
        email,
        reason,
        token,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        createdAt: new Date(),
        accessed: false,
        accessedAt: null,
      })
      .returning();
    
    // In a real application, you would send an email with the token
    // using SendGrid or another email service
    
    return NextResponse.json({ 
      success: true, 
      token: resumeRequest.token 
    }, { status: 201 });
  } catch (error) {
    console.error('Resume request error:', error);
    return NextResponse.json(
      { message: 'An error occurred while submitting the resume request' }, 
      { status: 500 }
    );
  }
}