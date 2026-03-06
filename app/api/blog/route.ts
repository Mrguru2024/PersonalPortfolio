import { NextRequest, NextResponse } from "next/server";
import { blogController } from "@server/controllers/blogController";
import { blogSeedPosts } from "@/lib/blogSeedData";
import {
  canCreateBlog,
  canPublishBlog,
  getIpAddress,
  getSessionUser,
} from "@/lib/auth-helpers";
import { createMockResponse } from "@/lib/api-helpers";
import { storage } from "@server/storage";
import { z } from "zod";

const BLOG_DB_TIMEOUT_MS = 5_000; // 5s – fail fast and return seed so homepage loads
const contributorSubmissionSchema = z.object({
  title: z.string().min(5),
  summary: z.string().min(10),
  content: z.string().min(50),
  coverImage: z.string().optional().default(""),
  tags: z.array(z.string()).min(1),
});

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(blogSeedPosts);
    }

    const mockReq = {
      query: Object.fromEntries(req.nextUrl.searchParams),
    } as any;

    const { mockRes, getResponse } = createMockResponse();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Database request timeout")),
        BLOG_DB_TIMEOUT_MS
      )
    );

    const controllerPromise = blogController
      .getBlogPosts(mockReq, mockRes)
      .catch(() => {});

    await Promise.race([controllerPromise, timeoutPromise]);

    const response = getResponse();
    if (!response) {
      console.warn("No response from blog controller, returning seed posts");
      return NextResponse.json(blogSeedPosts);
    }

    if (response.status === 404 || response.status === 500) {
      console.warn(
        "Blog controller returned",
        response.status,
        ", returning seed posts"
      );
      return NextResponse.json(blogSeedPosts);
    }

    return response;
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : typeof (error as { message?: string })?.message === "string"
          ? (error as { message: string }).message
          : String(error);
    console.error("Error in GET /api/blog:", msg);

    const errorMessage = msg.toLowerCase();
    const isConnectionError =
      errorMessage.includes("endpoint has been disabled") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("econnrefused") ||
      errorMessage.includes("econnreset") ||
      errorMessage.includes("terminated") ||
      errorMessage.includes("reset") ||
      errorMessage.includes("timeout");

    if (isConnectionError) {
      console.warn("Database unavailable or timeout, returning seed posts");
      return NextResponse.json(blogSeedPosts);
    }

    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Only approved developers/admins can write.
    if (!(await canCreateBlog(req))) {
      return NextResponse.json(
        {
          message:
            "Access denied. Only approved developers and admins can submit blog posts.",
        },
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

    const body = await req.json();

    // Approved admins can publish directly.
    if (await canPublishBlog(req)) {
      const mockReq = {
        body,
        user,
      } as any;

      const { mockRes, getResponse } = createMockResponse();
      await blogController.createBlogPost(mockReq, mockRes);

      const response = getResponse();
      if (!response) {
        return NextResponse.json(
          { error: "No response from controller" },
          { status: 500 }
        );
      }

      const responsePayload = await response.clone().json().catch(() => null);
      if (
        response.ok &&
        body?.isPublished === true &&
        responsePayload &&
        typeof responsePayload.id === "number"
      ) {
        const post = await storage.updateBlogPost(responsePayload.id, {
          isPublished: true,
        } as any);
        return NextResponse.json({
          ...post,
          publishedByAdmin: true,
          message: "Blog post published by admin.",
        });
      }

      return response;
    }

    // Approved developers submit for admin review (not published directly).
    const parsed = contributorSubmissionSchema.safeParse({
      title: body?.title,
      summary: body?.summary,
      content: body?.content,
      coverImage: body?.coverImage || "",
      tags: Array.isArray(body?.tags) ? body.tags : [],
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid blog submission data.",
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const contribution = await storage.createBlogPostContribution(
      {
        ...parsed.data,
        coverImage: parsed.data.coverImage || "/favicon.svg",
        authorName: user.full_name || user.username || "Developer Contributor",
        authorEmail: user.email || `${user.username}@local.dev`,
      },
      getIpAddress(req)
    );

    return NextResponse.json(
      {
        message:
          "Submission received. An admin will review and approve before publishing.",
        submittedForReview: true,
        contributionId: contribution.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/blog:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
