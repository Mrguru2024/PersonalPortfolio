import { NextRequest, NextResponse } from "next/server";
import { canCreateBlog } from "@/lib/auth-helpers";
import { generateBlogSummary } from "@server/services/blogAIService";

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

    const summary = await generateBlogSummary(title, content || "");
    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Error generating blog summary:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate blog summary" },
      { status: 500 }
    );
  }
}
