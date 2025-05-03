import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/db';
import { projects } from '@/shared/schema';
import { asc, desc, eq, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const tech = searchParams.get('tech');
    
    const db = getDb();
    
    if (id) {
      // Get single project by ID
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id));
        
      if (!project) {
        return NextResponse.json({ message: 'Project not found' }, { status: 404 });
      }
      
      return NextResponse.json(project);
    } else {
      // Get all projects, possibly filtered by tech
      let query = db.select().from(projects);
      
      if (tech) {
        query = query.where(
          like(projects.techStack, `%${tech}%`)
        );
      }
      
      // Order projects by their orderIndex if available, otherwise by default order
      const allProjects = await query.orderBy(asc(projects.order));
      
      return NextResponse.json(allProjects);
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { message: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be protected - check if user is authenticated and admin
    // In Next.js, this would typically be handled by middleware
    
    const data = await request.json();
    const db = getDb();
    
    // Get the highest current order value
    const [result] = await db
      .select({ maxOrder: ({ fn }) => fn.max(projects.order) })
      .from(projects);
    
    const nextOrder = (result?.maxOrder || 0) + 1;
    
    const [project] = await db
      .insert(projects)
      .values({
        ...data,
        order: nextOrder,
      })
      .returning();
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { message: 'Failed to create project' },
      { status: 500 }
    );
  }
}