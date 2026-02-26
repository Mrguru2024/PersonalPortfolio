import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { generateNewsletterContent } from "@server/services/newsletterAIService";

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

    const { topic, length, tone, customInstructions } = await req.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { message: "Topic is required" },
        { status: 400 }
      );
    }

    const content = await generateNewsletterContent(
      topic,
      length || "medium",
      tone || "professional",
      typeof customInstructions === "string" ? customInstructions : undefined
    );
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Error generating newsletter content:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate newsletter content" },
      { status: 500 }
    );
  }
}
