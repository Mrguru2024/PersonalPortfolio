import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { skills } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const { db } = getDb();

    // If category is provided, filter skills by category
    if (category) {
      const skillsByCategory = await db.query.skills.findMany({
        where: eq(skills.category, category),
        orderBy: (skills, { desc }) => [desc(skills.proficiency)]
      });

      return NextResponse.json(skillsByCategory);
    }

    // Otherwise, return all skills
    const allSkills = await db.query.skills.findMany({
      orderBy: [
        { column: skills.category, order: 'asc' },
        { column: skills.proficiency, order: 'desc' }
      ]
    });

    return NextResponse.json(allSkills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}