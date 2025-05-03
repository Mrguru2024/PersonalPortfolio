import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { projects } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const { db } = getDb();

    // If id is provided, return a specific project
    if (id) {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, id),
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      return NextResponse.json(project);
    }

    // Otherwise return all projects
    const allProjects = await db.query.projects.findMany({
      orderBy: [projects.order],
    });

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}