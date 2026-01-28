import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { generatePreviewText } from "@server/services/newsletterAIService";

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

    const { subject, content } = await req.json();

    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { message: "Subject is required" },
        { status: 400 }
      );
    }

    const previewText = await generatePreviewText(subject, content || "");
    return NextResponse.json({ previewText });
  } catch (error: any) {
    console.error("Error generating preview text:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate preview text" },
      { status: 500 }
    );
  }
}
