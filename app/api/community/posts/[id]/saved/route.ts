import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { getAfnDiscussionPostById, toggleAfnSavedPost } from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** POST /api/community/posts/[id]/saved — toggle saved post. */
export async function POST(
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
    if (!post || post.status !== "published") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const result = await toggleAfnSavedPost(Number(user.id), postId);
    return NextResponse.json(result);
  } catch (e) {
    console.error("POST community saved error:", e);
    return NextResponse.json({ error: "Failed to toggle saved" }, { status: 500 });
  }
}
