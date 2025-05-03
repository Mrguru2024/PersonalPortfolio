import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/db';
import { skills } from '@/shared/schema';
import { asc, desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    
    const db = getDb();
    
    if (category) {
      // Get skills by category
      const categorySkills = await db
        .select()
        .from(skills)
        .where(eq(skills.category, category))
        .orderBy(asc(skills.order));
      
      return NextResponse.json(categorySkills);
    } else {
      // Get all skills grouped by category
      const allSkills = await db
        .select()
        .from(skills)
        .orderBy(asc(skills.category), asc(skills.order));
      
      // Group skills by category for easier frontend display
      const groupedSkills = allSkills.reduce((acc, skill) => {
        if (!acc[skill.category]) {
          acc[skill.category] = [];
        }
        acc[skill.category].push(skill);
        return acc;
      }, {} as Record<string, typeof allSkills>);
      
      return NextResponse.json(groupedSkills);
    }
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { message: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be protected - check if user is authenticated and admin
    // This would be handled by middleware in Next.js
    
    const data = await request.json();
    const db = getDb();
    
    // Get the highest current order value in this category
    const [result] = await db
      .select({ maxOrder: ({ fn }) => fn.max(skills.order) })
      .from(skills)
      .where(eq(skills.category, data.category));
    
    const nextOrder = (result?.maxOrder || 0) + 1;
    
    const [skill] = await db
      .insert(skills)
      .values({
        ...data,
        order: nextOrder,
      })
      .returning();
    
    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json(
      { message: 'Failed to create skill' },
      { status: 500 }
    );
  }
}