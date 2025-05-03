import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { blogPosts } from '../../../shared/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const { db } = getDb();

    // If slug is provided, return a specific blog post
    if (slug) {
      const post = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, slug),
        with: {
          author: true,
        },
      });

      if (!post) {
        return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
      }

      return NextResponse.json(post);
    }

    // Otherwise return all published blog posts sorted by date
    const posts = await db.query.blogPosts.findMany({
      where: eq(blogPosts.isPublished, true),
      orderBy: [desc(blogPosts.publishedAt)],
      with: {
        author: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}