import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { eq } from 'drizzle-orm';
import { projects } from '../../../shared/schema';

export async function GET(request: NextRequest) {
  try {
    const { db } = getDb();
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      // Get specific project
      const project = await db.select().from(projects).where(eq(projects.id, id));
      
      if (!project || project.length === 0) {
        return NextResponse.json({ message: "Project not found" }, { status: 404 });
      }

      return NextResponse.json(project[0]);
    } else {
      // Get all projects
      const allProjects = await db.select().from(projects);
      return NextResponse.json(allProjects);
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ message: "Failed to fetch projects" }, { status: 500 });
  }
}