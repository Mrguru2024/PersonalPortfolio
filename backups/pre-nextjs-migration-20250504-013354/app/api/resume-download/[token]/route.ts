import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/db';
import { resumeRequests } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    if (!token) {
      return NextResponse.json(
        { message: 'Resume token is required' }, 
        { status: 400 }
      );
    }
    
    const db = getDb();
    
    // Find the resume request by token
    const [resumeRequest] = await db.select()
      .from(resumeRequests)
      .where(eq(resumeRequests.token, token));
    
    if (!resumeRequest) {
      return NextResponse.json(
        { message: 'Invalid resume token' }, 
        { status: 404 }
      );
    }
    
    // Mark resume as accessed if it hasn't been already
    if (!resumeRequest.accessed) {
      await db.update(resumeRequests)
        .set({ 
          accessed: true, 
          accessedAt: new Date() 
        })
        .where(eq(resumeRequests.id, resumeRequest.id));
    }
    
    // Path to resume file - adjust as needed for your file structure
    const resumePath = path.resolve(process.cwd(), 'public', 'anthony-feaster-resume.pdf');
    
    try {
      // Read the resume file
      const resumeFile = await fs.readFile(resumePath);
      
      // Set headers for PDF download
      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', 'attachment; filename="anthony-feaster-resume.pdf"');
      
      return new NextResponse(resumeFile, {
        status: 200,
        headers: headers,
      });
    } catch (fileError) {
      console.error('Resume file error:', fileError);
      return NextResponse.json(
        { message: 'Resume file not found' }, 
        { status: 404 }
      );
    }
  } catch (error) {
    console.error(`Resume download error for token: ${params.token}`, error);
    return NextResponse.json(
      { message: 'An error occurred while processing the resume download' }, 
      { status: 500 }
    );
  }
}