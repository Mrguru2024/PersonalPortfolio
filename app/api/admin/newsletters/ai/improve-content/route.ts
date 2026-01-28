import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { improveNewsletterContent } from "@server/services/newsletterAIService";

export async function POST(req: NextRequest) {
  try {
    // Check if requester is an approved admin
    const requesterIsAdmin = await isAdmin(req);
    if (!requesterIsAdmin) {
      return NextResponse.json(
        { message: "Admin access required" },
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

    const improvedContent = await improveNewsletterContent(content, instruction || "improve");
    return NextResponse.json({ content: improvedContent });
  } catch (error: any) {
    console.error("Error improving newsletter content:", error);
    return NextResponse.json(
      { message: error.message || "Failed to improve newsletter content" },
      { status: 500 }
    );
  }
}
