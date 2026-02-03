import type { BlogPost } from "@/lib/data";
import { blogSeedPosts } from "@/lib/blogSeedData";

export async function fetchBlogSeedPosts(): Promise<BlogPost[]> {
  return blogSeedPosts as BlogPost[];
}

export async function fetchBlogSeedPost(
  slug: string
): Promise<BlogPost | null> {
  const posts = await fetchBlogSeedPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}
