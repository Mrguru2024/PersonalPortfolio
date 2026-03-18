import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getAfnCollaborationPostById,
  updateAfnCollaborationPost,
  deleteAfnCollaborationPost,
} from "@server/afnStorage";
import { db } from "@server/db";
import { afnProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/community/collab/[id] — get single collab post with author. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);
    if (Number.isNaN(postId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const post = await getAfnCollaborationPostById(postId);
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const [authorProfile] = await db
      .select()
      .from(afnProfiles)
      .where(eq(afnProfiles.userId, post.authorId))
      .limit(1);
    return NextResponse.json({ post, authorProfile: authorProfile ?? null });
  } catch (e) {
    console.error("GET community collab error:", e);
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }
}

/** PATCH /api/community/collab/[id] — update (author only). */
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
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const post = await getAfnCollaborationPostById(postId);
    if (!post || post.authorId !== Number(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.status !== undefined && ["open", "closed"].includes(body.status)) updates.status = body.status;
    if (body.contactPreference !== undefined) updates.contactPreference = body.contactPreference;
    if (body.externalContactUrl !== undefined) updates.externalContactUrl = body.externalContactUrl ? String(body.externalContactUrl).trim() : null;
    if (body.budgetRange !== undefined) updates.budgetRange = body.budgetRange ? String(body.budgetRange).trim() : null;
    if (body.timeline !== undefined) updates.timeline = body.timeline ? String(body.timeline).trim() : null;
    if (body.industry !== undefined) updates.industry = body.industry ? String(body.industry).trim() : null;
    if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags : undefined;
    const updated = await updateAfnCollaborationPost(postId, updates as Parameters<typeof updateAfnCollaborationPost>[1]);
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH community collab error:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

/** DELETE /api/community/collab/[id] — delete (author only). */
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
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const post = await getAfnCollaborationPostById(postId);
    if (!post || post.authorId !== Number(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await deleteAfnCollaborationPost(postId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE community collab error:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
