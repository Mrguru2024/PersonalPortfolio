import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/db';
import { projects } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { message: 'Project ID is required' }, 
        { status: 400 }
      );
    }
    
    const db = getDb();
    const [project] = await db.select()
      .from(projects)
      .where(eq(projects.id, id));
    
    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error(`Project fetch error for ID: ${params.id}`, error);
    return NextResponse.json(
      { message: 'An error occurred while fetching the project' }, 
      { status: 500 }
    );
  }
}