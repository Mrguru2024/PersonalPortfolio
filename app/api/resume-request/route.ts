import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { resumeRequests, resumeRequestFormSchema } from '../../../shared/schema';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // Validate the form data
    const result = resumeRequestFormSchema.safeParse(formData);
    
    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid form data', errors: result.error.errors },
        { status: 400 }
      );
    }
    
    const { db } = getDb();
    
    // Generate unique access token
    const accessToken = randomBytes(32).toString('hex');
    
    // Create resume request
    const [resumeRequest] = await db.insert(resumeRequests)
      .values({
        ...result.data,
        createdAt: new Date().toISOString(),
        accessToken,
        accessed: false,
      })
      .returning();
    
    // Generate download URL with the token
    const baseUrl = request.headers.get('host') || process.env.NEXT_PUBLIC_BASE_URL || '';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const downloadUrl = `${protocol}://${baseUrl}/resume/${accessToken}`;
    
    // TODO: Send email with download link if needed
    
    return NextResponse.json({
      message: 'Resume request submitted successfully',
      downloadUrl,
      accessToken,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error submitting resume request:', error);
    return NextResponse.json(
      { message: 'An error occurred while submitting the request' },
      { status: 500 }
    );
  }
}