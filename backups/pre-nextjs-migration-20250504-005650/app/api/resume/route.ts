import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { resumeRequests } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const { db } = getDb();
    
    // Find the resume request with this token
    const resumeRequest = await db.query.resumeRequests.findFirst({
      where: eq(resumeRequests.token, token),
    });

    if (!resumeRequest) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    // Check if the request is older than 7 days
    const requestDate = new Date(resumeRequest.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - requestDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      return NextResponse.json({ error: 'Download link has expired' }, { status: 410 });
    }

    // Mark as accessed if it hasn't been accessed before
    if (!resumeRequest.accessed) {
      await db.update(resumeRequests)
        .set({ 
          accessed: true,
          accessedAt: new Date(),
        })
        .where(eq(resumeRequests.id, resumeRequest.id));
    }

    // Get the resume file
    const resumePath = path.join(process.cwd(), 'public', 'Anthony_Feaster_Resume.pdf');
    
    try {
      const fileBuffer = await fs.readFile(resumePath);
      
      // Set headers for the response
      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', 'attachment; filename="Anthony_Feaster_Resume.pdf"');
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });
    } catch (fileError) {
      console.error('Error reading resume file:', fileError);
      return NextResponse.json({ error: 'Resume file not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error processing resume download:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}