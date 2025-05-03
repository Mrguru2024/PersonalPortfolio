import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/db';
import { skills } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    const db = getDb();
    let query = db.select().from(skills);
    
    if (category) {
      query = query.where(eq(skills.category, category));
    }
    
    const allSkills = await query;
    
    return NextResponse.json(allSkills);
  } catch (error) {
    console.error('Skills fetch error:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching skills' }, 
      { status: 500 }
    );
  }
}