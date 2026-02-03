import { NextRequest, NextResponse } from "next/server";
import { blogController } from "@server/controllers/blogController";
import { blogSeedPosts } from "@/lib/blogSeedData";
import { canCreateBlog, getSessionUser } from "@/lib/auth-helpers";
import { createMockResponse } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(blogSeedPosts);
    }

    const mockReq = {
      query: Object.fromEntries(req.nextUrl.searchParams),
    } as any;

    const { mockRes, getResponse } = createMockResponse();
    await blogController.getBlogPosts(mockReq, mockRes);

    const response = getResponse();
    if (!response) {
      console.warn("No response from blog controller, returning seed posts");
      return NextResponse.json(blogSeedPosts);
    }

    if (response.status === 404) {
      console.warn("Blog posts 404 from controller, returning seed posts");
      return NextResponse.json(blogSeedPosts);
    }

    return response;
  } catch (error: any) {
    console.error("Error in GET /api/blog:", error);

    // Check if it's a database connection error
    const errorMessage = error?.message || String(error);
    if (
      errorMessage.includes("endpoint has been disabled") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      console.warn("Database unavailable, returning seed posts");
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
