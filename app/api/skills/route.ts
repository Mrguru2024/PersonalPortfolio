import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { eq } from 'drizzle-orm';
import { skills } from '../../../shared/schema';

export async function GET(request: NextRequest) {
  try {
    const { db } = getDb();
    const category = request.nextUrl.searchParams.get('category');

    if (category) {
      // Get skills by category
      const filteredSkills = await db.select().from(skills).where(eq(skills.category, category));
      return NextResponse.json(filteredSkills);
    } else {
      // Get all skills
      const allSkills = await db.select().from(skills);
      return NextResponse.json(allSkills);
    }
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ message: "Failed to fetch skills" }, { status: 500 });
  }
}