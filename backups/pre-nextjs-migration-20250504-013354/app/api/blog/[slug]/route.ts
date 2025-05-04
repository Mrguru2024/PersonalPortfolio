import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/db';
import { blogPosts } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { message: 'Blog post slug is required' }, 
        { status: 400 }
      );
    }
    
    const db = getDb();
    const [post] = await db.select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));
    
    if (!post) {
      return NextResponse.json(
        { message: 'Blog post not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(post);
  } catch (error) {
    console.error(`Blog post fetch error for slug: ${params.slug}`, error);
    return NextResponse.json(
      { message: 'An error occurred while fetching the blog post' }, 
      { status: 500 }
    );
  }
}