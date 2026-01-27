import { NextRequest, NextResponse } from "next/server";
import { blogController } from "@server/controllers/blogController";
import { canCreateBlog, getSessionUser } from "@/lib/auth-helpers";
import { createMockResponse } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const mockReq = {
      query: Object.fromEntries(req.nextUrl.searchParams),
    } as any;
    
    const { mockRes, getResponse } = createMockResponse();
    await blogController.getBlogPosts(mockReq, mockRes);
    
    const response = getResponse();
    if (!response) {
      // Return empty array if no response (database might be unavailable)
      console.warn("No response from blog controller, returning empty array");
      return NextResponse.json([]);
    }
    
    return response;
  } catch (error: any) {
    console.error("Error in GET /api/blog:", error);
    
    // Check if it's a database connection error
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('endpoint has been disabled') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('ECONNREFUSED')) {
      console.warn("Database unavailable, returning empty array for blog posts");
      return NextResponse.json([]);
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
        { message: "Access denied. Only admins and approved writers can create blog posts." },
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

