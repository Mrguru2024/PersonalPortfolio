import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { skills } from '../../../shared/schema';
import { asc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const { db } = getDb();

    // If category is provided, return skills for that category
    if (category) {
      const categorySkills = await db.query.skills.findMany({
        where: eq(skills.category, category),
        orderBy: [asc(skills.order)],
      });

      return NextResponse.json(categorySkills);
    }

    // Otherwise return all skills grouped by category
    const allSkills = await db.query.skills.findMany({
      orderBy: [asc(skills.category), asc(skills.order)],
    });

    // Group skills by category
    const grouped = allSkills.reduce((acc: Record<string, typeof allSkills>, skill) => {
      const category = skill.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {});

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}