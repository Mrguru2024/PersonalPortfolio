import { NextRequest, NextResponse } from "next/server";
import { blogController } from "@server/controllers/blogController";
import { createMockResponse } from "@/lib/api-helpers";
import { getIpAddress } from "@/lib/auth-helpers";

// GET comments for a blog post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const postIdNum = Number.parseInt(postId, 10);
    
    if (Number.isNaN(postIdNum)) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }
    
    const mockReq = {
      params: { postId: postId },
    } as any;
    
    const { mockRes, getResponse } = createMockResponse();
    await blogController.getPostComments(mockReq, mockRes);
    
    const response = getResponse();
    if (!response) {
      // Return empty array if no comments
      return NextResponse.json([]);
    }
    
    return response;
  } catch (error: any) {
    // Check if it's a database error
    const errorMessage = error?.message || String(error) || "";
    if (errorMessage.includes('column') || 
        errorMessage.includes('does not exist') ||
        errorMessage.includes('connection')) {
      // Return empty array for database errors
      return NextResponse.json([]);
    }
    
    console.error("Error in GET /api/blog/post/[postId]/comments:", error);
    
    // Return empty array on error to prevent UI issues
    return NextResponse.json([]);
  }
}

// POST a new comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const postIdNum = Number.parseInt(postId, 10);
    
    if (Number.isNaN(postIdNum)) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const ipAddress = getIpAddress(req);
    
    const mockReq = {
      params: { postId: postId },
      body,
      ip: ipAddress,
      socket: { remoteAddress: ipAddress },
    } as any;
    
    const { mockRes, getResponse } = createMockResponse();
    await blogController.addComment(mockReq, mockRes);
    
    const response = getResponse();
    if (!response) {
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }
    
    return response;
  } catch (error: any) {
    console.error("Error in POST /api/blog/post/[postId]/comments:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: "Invalid comment data", details: (error as any).errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
