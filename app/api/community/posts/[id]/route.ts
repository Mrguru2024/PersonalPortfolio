import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getAfnDiscussionPostById,
  updateAfnDiscussionPost,
  getAfnDiscussionCategories,
  incrementAfnPostViewCount,
} from "@server/afnStorage";
import { db } from "@server/db";
import { afnProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/community/posts/[id] — get single post with author profile and category. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);
    if (Number.isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }
    const post = await getAfnDiscussionPostById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.status !== "published") {
      const user = await getSessionUser(req);
      if (!user?.id || Number(user.id) !== post.authorId) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    }

    incrementAfnPostViewCount(postId).catch(() => {});

    const [authorProfile] = await db
      .select()
      .from(afnProfiles)
      .where(eq(afnProfiles.userId, post.authorId))
      .limit(1);
    const categories = await getAfnDiscussionCategories(false);
    const category = categories.find((c) => c.id === post.categoryId);

    return NextResponse.json({
      post,
      authorProfile: authorProfile ?? null,
      category: category ?? null,
    });
  } catch (e) {
    console.error("GET community post error:", e);
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }
}

/** PATCH /api/community/posts/[id] — update post (author only). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const postId = parseInt(id, 10);
    if (Number.isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }
    const post = await getAfnDiscussionPostById(postId);
    if (!post || post.authorId !== Number(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.body !== undefined) updates.body = String(body.body).trim();
    if (body.excerpt !== undefined) updates.excerpt = String(body.excerpt).slice(0, 300);
    if (body.status !== undefined && ["draft", "published", "archived"].includes(body.status))
      updates.status = body.status;
    const updated = await updateAfnDiscussionPost(postId, updates as Parameters<typeof updateAfnDiscussionPost>[1]);
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH community post error:", e);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

/** DELETE /api/community/posts/[id] — delete post (author only). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(_req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const postId = parseInt(id, 10);
    if (Number.isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }
    const post = await getAfnDiscussionPostById(postId);
    if (!post || post.authorId !== Number(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await updateAfnDiscussionPost(postId, { status: "archived" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE community post error:", e);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
