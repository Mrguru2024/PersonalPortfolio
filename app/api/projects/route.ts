import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { projects } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { db } = getDb();

    // If ID is provided, return a single project
    if (id) {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, id),
      });

      if (!project) {
        return NextResponse.json({ message: 'Project not found' }, { status: 404 });
      }

      return NextResponse.json(project);
    }

    // Otherwise, return all projects
    const allProjects = await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.featured), desc(projects.order)]
    });

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}