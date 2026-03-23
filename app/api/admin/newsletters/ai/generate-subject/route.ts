import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { generateSubjectLines } from "@server/services/newsletterAIService";
import { storage } from "@server/storage";
import { formatKnowledgeForMessagesPrompt } from "@server/services/adminAgentKnowledgeContext";

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

    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    let mergedInstructions = typeof customInstructions === "string" ? customInstructions.trim() : "";
    if (userId != null) {
      const kbRows = await storage.getAdminAgentKnowledgeForMessages(userId);
      const kbBlock = formatKnowledgeForMessagesPrompt(kbRows);
      if (kbBlock) {
        mergedInstructions = [mergedInstructions, kbBlock].filter(Boolean).join("\n\n");
      }
    }

    const subjectLines = await generateSubjectLines(
      topic,
      tone || "professional",
      mergedInstructions.trim() ? mergedInstructions : undefined
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
