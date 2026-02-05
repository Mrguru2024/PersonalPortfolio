import { NextRequest, NextResponse } from "next/server";
import { blogController } from "@server/controllers/blogController";
import { blogSeedPosts } from "@/lib/blogSeedData";
import { canCreateBlog, getSessionUser } from "@/lib/auth-helpers";
import { createMockResponse } from "@/lib/api-helpers";

const BLOG_DB_TIMEOUT_MS = 5_000; // 5s – fail fast and return seed so homepage loads

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

    await Promise.race([
      blogController.getBlogPosts(mockReq, mockRes),
      timeoutPromise,
    ]);

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
  } catch (error: any) {
    console.error("Error in GET /api/blog:", error);

    const errorMessage = (error?.message || String(error)).toLowerCase();
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
    // Check if user can create blogs (admin or approved writer)
    if (!(await canCreateBlog(req))) {
      return NextResponse.json(
        {
          message:
            "Access denied. Only admins and approved writers can create blog posts.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const mockReq = {
      body,
      user: await getSessionUser(req),
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

    return response;
  } catch (error: any) {
    console.error("Error in POST /api/blog:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
