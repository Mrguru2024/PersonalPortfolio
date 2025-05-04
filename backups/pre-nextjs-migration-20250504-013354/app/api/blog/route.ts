import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/db';
import { blogPosts, blogPostContributions, blogComments } from '@/shared/schema';
// Temporarily use dummy data for development until db connection is fully configured
import { BlogPost } from '@/shared/schema';
import { asc, desc, eq, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    
    const db = getDb();
    
    if (slug) {
      // Get single blog post by slug
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, slug))
        .leftJoin(blogComments, eq(blogComments.postId, blogPosts.id))
        .orderBy(desc(blogPosts.publishedAt));
        
      if (!post) {
        return NextResponse.json({ message: 'Blog post not found' }, { status: 404 });
      }
      
      return NextResponse.json(post);
    } else {
      // Get all published blog posts
      const posts = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.published, true))
        .orderBy(desc(blogPosts.publishedAt));
      
      return NextResponse.json(posts);
    }
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { message: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be protected - check if user is authenticated and admin
    // This is handled by middleware in Next.js
    
    const data = await request.json();
    const db = getDb();
    
    const [post] = await db
      .insert(blogPosts)
      .values({
        title: data.title,
        slug: data.slug,
        content: data.content,
        summary: data.summary,
        featuredImage: data.featuredImage,
        tags: data.tags,
        authorId: data.authorId,
        published: data.published ?? false,
        publishedAt: data.published ? new Date() : null,
      })
      .returning();
    
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { message: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}