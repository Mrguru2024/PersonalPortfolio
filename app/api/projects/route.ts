import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/db';
import { projects } from '@/shared/schema';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const allProjects = await db.select().from(projects);
    
    return NextResponse.json(allProjects);
  } catch (error) {
    console.error('Projects fetch error:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching projects' }, 
      { status: 500 }
    );
  }
}