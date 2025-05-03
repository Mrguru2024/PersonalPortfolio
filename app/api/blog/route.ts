import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { blogPosts, blogComments } from '../../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const { db } = getDb();

    // If slug is provided, return a single blog post
    if (slug) {
      const post = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, slug),
        with: {
          author: true,
          comments: {
            where: and(
              eq(blogComments.isApproved, true),
              eq(blogComments.isSpam, false)
            ),
            orderBy: desc(blogComments.createdAt)
          }
        }
      });

      if (!post) {
        return NextResponse.json({ message: 'Blog post not found' }, { status: 404 });
      }

      return NextResponse.json(post);
    }

    // Otherwise, return all published blog posts
    const posts = await db.query.blogPosts.findMany({
      where: eq(blogPosts.isPublished, true),
      with: {
        author: true
      },
      orderBy: desc(blogPosts.publishedAt)
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}