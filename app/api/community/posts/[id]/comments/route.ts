import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getAfnDiscussionPostById,
  getAfnCommentsByPostId,
  createAfnDiscussionComment,
  createAfnNotification,
} from "@server/afnStorage";
import { db } from "@server/db";
import { afnProfiles } from "@shared/schema";
import { inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/community/posts/[id]/comments — list comments with author profiles. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);
    if (Number.isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }
    const post = await getAfnDiscussionPostById(postId);
    if (!post || post.status !== "published") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const comments = await getAfnCommentsByPostId(postId);
    const authorIds = [...new Set(comments.map((c) => c.authorId))];
    const profiles =
      authorIds.length > 0
        ? await db.select().from(afnProfiles).where(inArray(afnProfiles.userId, authorIds))
        : [];
    const profilesByUserId = new Map(profiles.map((p) => [p.userId, p]));
    const commentsWithAuthors = comments.map((c) => ({
      ...c,
      authorProfile: profilesByUserId.get(c.authorId) ?? null,
    }));
    return NextResponse.json(commentsWithAuthors);
  } catch (e) {
    console.error("GET community comments error:", e);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

/** POST /api/community/posts/[id]/comments — add comment. Body: body, parentCommentId?. */
export async function POST(
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
    if (!post || post.status !== "published") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const body = await req.json().catch(() => ({}));
    const bodyText = String(body.body ?? "").trim();
    if (!bodyText) {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }
    const comment = await createAfnDiscussionComment({
      postId,
      authorId: Number(user.id),
      parentCommentId: body.parentCommentId ? parseInt(String(body.parentCommentId), 10) : null,
      body: bodyText,
      status: "published",
    });
    if (post.authorId !== Number(user.id)) {
      createAfnNotification({
        userId: post.authorId,
        type: "comment",
        title: "New comment on your post",
        body: bodyText.slice(0, 100) + (bodyText.length > 100 ? "…" : ""),
        entityType: "post",
        entityId: postId,
      }).catch(() => {});
    }
    return NextResponse.json(comment);
  } catch (e) {
    console.error("POST community comment error:", e);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
