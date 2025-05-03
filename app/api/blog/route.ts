import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/db';
import { blogPosts } from '@/shared/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    
    // Check for query parameters
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    
    // Build query based on parameters
    let query = db.select().from(blogPosts);
    
    if (published === 'true') {
      query = query.where(eq(blogPosts.published, true));
    }
    
    // Order by publish date descending
    const posts = await query.orderBy(desc(blogPosts.publishedAt));
    
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Blog posts fetch error:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching blog posts' }, 
      { status: 500 }
    );
  }
}