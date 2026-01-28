import { NextRequest, NextResponse } from "next/server";
import { canCreateBlog } from "@/lib/auth-helpers";
import { generateBlogTags } from "@server/services/blogAIService";

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

    const { title, content } = await req.json();

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 }
      );
    }

    const tags = await generateBlogTags(title, content || "");
    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error("Error generating blog tags:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate blog tags" },
      { status: 500 }
    );
  }
}
