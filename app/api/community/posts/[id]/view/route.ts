import { NextRequest, NextResponse } from "next/server";
import { getAfnDiscussionPostById, incrementAfnPostViewCount } from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** POST /api/community/posts/[id]/view — increment view count. */
export async function POST(
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
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    await incrementAfnPostViewCount(postId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST community post view error:", e);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}
