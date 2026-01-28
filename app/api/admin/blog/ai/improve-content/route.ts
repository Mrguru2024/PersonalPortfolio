import { NextRequest, NextResponse } from "next/server";
import { canCreateBlog } from "@/lib/auth-helpers";
import { improveBlogContent } from "@server/services/blogAIService";

export async function POST(req: NextRequest) {
  try {
    // Check if requester can create blogs
    const canCreate = await canCreateBlog(req);
    if (!canCreate) {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    const { content, instruction } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 }
      );
    }

    const improvedContent = await improveBlogContent(content, instruction || "improve");
    return NextResponse.json({ content: improvedContent });
  } catch (error: any) {
    console.error("Error improving blog content:", error);
    return NextResponse.json(
      { message: error.message || "Failed to improve blog content" },
      { status: 500 }
    );
  }
}
