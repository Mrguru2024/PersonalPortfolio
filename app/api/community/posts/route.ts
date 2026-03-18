import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getAfnDiscussionPosts,
  createAfnDiscussionPost,
  getAfnDiscussionCategories,
  getAfnSavedPostIds,
} from "@server/afnStorage";
import { db } from "@server/db";
import { afnProfiles } from "@shared/schema";
import { inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/community/posts — list posts. Query: categoryId, categorySlug, limit, offset. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("categorySlug");
    const categoryIdParam = searchParams.get("categoryId");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10) || 0;

    let categoryId: number | undefined;
    if (categorySlug) {
      const categories = await getAfnDiscussionCategories(false);
      const cat = categories.find((c) => c.slug === categorySlug);
      categoryId = cat?.id;
    } else if (categoryIdParam) {
      categoryId = parseInt(categoryIdParam, 10);
      if (Number.isNaN(categoryId)) categoryId = undefined;
    }

    const posts = await getAfnDiscussionPosts({
      categoryId,
      status: "published",
      limit,
      offset,
    });

    let savedIds: number[] = [];
    if (user?.id) {
      savedIds = await getAfnSavedPostIds(Number(user.id));
    }

    const authorIds = [...new Set(posts.map((p) => p.authorId))];
    const profiles =
      authorIds.length > 0
        ? await db.select().from(afnProfiles).where(inArray(afnProfiles.userId, authorIds))
        : [];
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));
    const postsWithAuthors = posts.map((p) => ({
      ...p,
      authorProfile: profileByUserId.get(p.authorId) ?? null,
    }));

    return NextResponse.json({
      posts: postsWithAuthors,
      savedPostIds: savedIds,
    });
  } catch (e) {
    console.error("GET community posts error:", e);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

/** POST /api/community/posts — create a post. Body: categoryId, title, body, excerpt?, status?. */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const categoryId = body.categoryId;
    const title = String(body.title ?? "").trim();
    const bodyText = String(body.body ?? "").trim();
    if (!categoryId || !title || !bodyText) {
      return NextResponse.json(
        { error: "categoryId, title, and body are required" },
        { status: 400 }
      );
    }
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ||
      `post-${Date.now()}`;
    const post = await createAfnDiscussionPost({
      authorId: Number(user.id),
      categoryId: Number(categoryId),
      title,
      slug,
      body: bodyText,
      excerpt: body.excerpt ? String(body.excerpt).slice(0, 300) : bodyText.slice(0, 200),
      status: body.status === "draft" ? "draft" : "published",
    });
    return NextResponse.json(post);
  } catch (e) {
    console.error("POST community posts error:", e);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
