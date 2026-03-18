import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getAfnCollaborationPosts,
  createAfnCollaborationPost,
} from "@server/afnStorage";
import { db } from "@server/db";
import { afnProfiles } from "@shared/schema";
import { inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/community/collab — list collaboration posts. Query: status, type, limit. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const type = searchParams.get("type") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);
    const posts = await getAfnCollaborationPosts({ status, type, limit });
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
    return NextResponse.json(postsWithAuthors);
  } catch (e) {
    console.error("GET community collab error:", e);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

/** POST /api/community/collab — create collaboration post. */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const type = String(body.type ?? "").trim();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    if (!type || !title || !description) {
      return NextResponse.json(
        { error: "type, title, and description are required" },
        { status: 400 }
      );
    }
    const post = await createAfnCollaborationPost({
      authorId: Number(user.id),
      type,
      title,
      description,
      status: body.status === "closed" ? "closed" : "open",
      contactPreference: body.contactPreference ?? "inbox",
      externalContactUrl: body.externalContactUrl ? String(body.externalContactUrl).trim() : null,
      budgetRange: body.budgetRange ? String(body.budgetRange).trim() : null,
      timeline: body.timeline ? String(body.timeline).trim() : null,
      industry: body.industry ? String(body.industry).trim() : null,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
    });
    return NextResponse.json(post);
  } catch (e) {
    console.error("POST community collab error:", e);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
