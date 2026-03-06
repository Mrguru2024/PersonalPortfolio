import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function createUniqueSlug(baseTitle: string): Promise<string> {
  const base = toSlug(baseTitle) || "developer-post";
  let candidate = base;
  let suffix = 2;
  while (await storage.getBlogPostBySlug(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required." },
        { status: 403 }
      );
    }

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const contributionId = Number.parseInt(id, 10);
    if (Number.isNaN(contributionId)) {
      return NextResponse.json(
        { message: "Invalid contribution id." },
        { status: 400 }
      );
    }

    const contribution = await storage.getBlogPostContributionById(contributionId);
    if (!contribution) {
      return NextResponse.json(
        { message: "Contribution not found." },
        { status: 404 }
      );
    }

    if (contribution.isReviewed) {
      return NextResponse.json(
        { message: "This contribution has already been reviewed." },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const decision =
      body?.decision === "approve" || body?.decision === "reject"
        ? body.decision
        : null;
    const notes = typeof body?.notes === "string" ? body.notes.trim() : undefined;

    if (!decision) {
      return NextResponse.json(
        { message: "Decision must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    if (decision === "reject") {
      const reviewed = await storage.reviewBlogPostContribution(
        contributionId,
        false,
        notes
      );
      return NextResponse.json({
        message: "Contribution rejected.",
        contribution: reviewed,
      });
    }

    const reviewed = await storage.reviewBlogPostContribution(
      contributionId,
      true,
      notes
    );
    const slug = await createUniqueSlug(contribution.title);
    const now = new Date();
    const createdPost = await storage.createBlogPost(
      {
        title: contribution.title,
        slug,
        summary: contribution.summary,
        content: contribution.content,
        coverImage: contribution.coverImage,
        tags: contribution.tags,
        publishedAt: now,
        updatedAt: now,
      } as any,
      user.id
    );
    const publishedPost = await storage.updateBlogPost(createdPost.id, {
      isPublished: true,
    } as any);

    return NextResponse.json({
      message: "Contribution approved and published.",
      contribution: reviewed,
      post: publishedPost,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/blog/contributions/[id]/review:", error);
    return NextResponse.json(
      { message: "Failed to process contribution review." },
      { status: 500 }
    );
  }
}
