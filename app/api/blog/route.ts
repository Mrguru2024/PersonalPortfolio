import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../db';
import { desc, eq } from 'drizzle-orm';
import { blogPosts } from '../../../shared/schema';

export async function GET(request: NextRequest) {
  try {
    const { db } = getDb();
    const slug = request.nextUrl.searchParams.get('slug');

    if (slug) {
      // Get specific blog post
      const post = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, slug),
        with: {
          author: true
        }
      });

      if (!post) {
        return NextResponse.json({ message: "Blog post not found" }, { status: 404 });
      }

      return NextResponse.json(post);
    } else {
      // Get all published blog posts
      const posts = await db.query.blogPosts.findMany({
        where: eq(blogPosts.isPublished, true),
        orderBy: [desc(blogPosts.publishedAt)],
        with: {
          author: true
        }
      });

      return NextResponse.json(posts);
    }
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ message: "Failed to fetch blog posts" }, { status: 500 });
  }
}