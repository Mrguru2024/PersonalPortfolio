import { NextRequest, NextResponse } from "next/server";
import { canCreateBlog } from "@/lib/auth-helpers";
import { generateBlogContent } from "@server/services/blogAIService";

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

    const { topic, length, style, customInstructions } = await req.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { message: "Topic is required" },
        { status: 400 }
      );
    }

    const content = await generateBlogContent(
      topic,
      length || "medium",
      style || "professional",
      typeof customInstructions === "string" ? customInstructions : undefined
    );
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Error generating blog content:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate blog content" },
      { status: 500 }
    );
  }
}
