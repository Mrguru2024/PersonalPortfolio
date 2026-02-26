import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { generateSubjectLines } from "@server/services/newsletterAIService";

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

    const { topic, tone, customInstructions } = await req.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { message: "Topic is required" },
        { status: 400 }
      );
    }

    const subjectLines = await generateSubjectLines(
      topic,
      tone || "professional",
      typeof customInstructions === "string" ? customInstructions : undefined
    );
    return NextResponse.json({ subjectLines });
  } catch (error: any) {
    console.error("Error generating subject lines:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate subject lines" },
      { status: 500 }
    );
  }
}
