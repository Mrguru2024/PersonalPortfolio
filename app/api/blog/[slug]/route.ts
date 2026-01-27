import { NextRequest, NextResponse } from "next/server";
import { blogController } from "@server/controllers/blogController";
import { createMockResponse } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const mockReq = {
      params: { slug },
    } as any;
    
    const { mockRes, getResponse } = createMockResponse();
    await blogController.getBlogPostBySlug(mockReq, mockRes);
    
    const response = getResponse();
    if (!response) {
      return NextResponse.json(
        { error: "No response from controller" },
        { status: 500 }
      );
    }
    
    return response;
  } catch (error: any) {
    console.error("Error in GET /api/blog/[slug]:", error);
    
    // Check if it's a database connection error
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('endpoint has been disabled') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('ECONNREFUSED')) {
      console.warn("Database unavailable, returning 404 for blog post");
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}
