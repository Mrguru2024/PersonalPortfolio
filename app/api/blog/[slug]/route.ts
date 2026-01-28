import { NextRequest, NextResponse } from "next/server";
import { blogController } from "@server/controllers/blogController";
import { createMockResponse } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json(
        { error: "Blog post slug is required" },
        { status: 400 }
      );
    }
    
    const mockReq = {
      params: { slug },
    } as any;
    
    const { mockRes, getResponse } = createMockResponse();
    
    try {
      await blogController.getBlogPostBySlug(mockReq, mockRes);
    } catch (controllerError: any) {
      // If controller throws an error, check if it's a database error
      const errorMessage = controllerError?.message || String(controllerError) || "";
      if (errorMessage.includes('endpoint has been disabled') || 
          errorMessage.includes('connection') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('column') ||
          errorMessage.includes('does not exist')) {
        console.warn("Database error in controller, returning 404 for blog post:", errorMessage);
        return NextResponse.json(
          { error: "Blog post not found" },
          { status: 404 }
        );
      }
      // Re-throw if it's not a database error
      throw controllerError;
    }
    
    const response = getResponse();
    if (!response) {
      // If no response was set, the post likely doesn't exist
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }
    
    return response;
  } catch (error: any) {
    console.error("Error in GET /api/blog/[slug]:", error);
    
    // Always return JSON, never HTML
    const errorMessage = error?.message || String(error) || "";
    if (errorMessage.includes('endpoint has been disabled') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('column') ||
        errorMessage.includes('does not exist')) {
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
