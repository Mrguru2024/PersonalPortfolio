import { NextRequest, NextResponse } from "next/server";
import { canCreateBlog } from "@/lib/auth-helpers";
import { generateBlogTitles } from "@server/services/blogAIService";

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

    const { topic, style } = await req.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { message: "Topic is required" },
        { status: 400 }
      );
    }

    const titles = await generateBlogTitles(topic, style || "professional");
    return NextResponse.json({ titles });
  } catch (error: any) {
    console.error("Error generating blog titles:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate blog titles" },
      { status: 500 }
    );
  }
}
